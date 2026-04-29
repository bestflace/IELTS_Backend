import { Job } from "bullmq";
import {
  Prisma,
  attempt_status,
  grading_job_status,
  test_type,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { generateGeminiJson } from "../../config/ai";
import { AiGradingJobData } from "../queues/grading.queue";

type WritingAiResult = {
  overallBand: number;
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRangeAccuracy: number;
  summary: string;
  actionItems: string[];
};

type SpeakingAiResult = {
  overallBand: number;
  fluencyCoherence: number;
  lexicalResource: number;
  grammaticalRangeAccuracy: number;
  pronunciation: number;
  summary: string;
  actionItems: string[];
};

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function isFinalAttempt(job: Job) {
  const maxAttempts = Number(job.opts.attempts || 1);
  return job.attemptsMade + 1 >= maxAttempts;
}

function assertBand(value: unknown, field: string) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 9
  ) {
    throw new Error(`Invalid IELTS band for ${field}`);
  }
}

function validateActionItems(value: unknown, field: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${field} must be string[]`);
  }
}

function validateWritingResult(data: WritingAiResult) {
  assertBand(data.overallBand, "overallBand");
  assertBand(data.taskAchievement, "taskAchievement");
  assertBand(data.coherenceCohesion, "coherenceCohesion");
  assertBand(data.lexicalResource, "lexicalResource");
  assertBand(data.grammaticalRangeAccuracy, "grammaticalRangeAccuracy");

  if (typeof data.summary !== "string") {
    throw new Error("summary must be string");
  }

  validateActionItems(data.actionItems, "actionItems");
}

function validateSpeakingResult(data: SpeakingAiResult) {
  assertBand(data.overallBand, "overallBand");
  assertBand(data.fluencyCoherence, "fluencyCoherence");
  assertBand(data.lexicalResource, "lexicalResource");
  assertBand(data.grammaticalRangeAccuracy, "grammaticalRangeAccuracy");
  assertBand(data.pronunciation, "pronunciation");

  if (typeof data.summary !== "string") {
    throw new Error("summary must be string");
  }

  validateActionItems(data.actionItems, "actionItems");
}

async function findAiJob(params: {
  aiGradingId?: string;
  attemptId: string;
  skill: typeof test_type.WRITING | typeof test_type.SPEAKING;
}) {
  if (params.aiGradingId) {
    return prisma.ai_gradings.findUnique({
      where: {
        id: params.aiGradingId,
      },
    });
  }

  return prisma.ai_gradings.findFirst({
    where: {
      attempt_id: params.attemptId,
      skill: params.skill,
      provider: "GEMINI",
    },
    orderBy: {
      created_at: "desc",
    },
  });
}

async function upsertAttemptSummaryJson(
  attemptId: string,
  patch: Record<string, unknown>,
  bandEstimate?: number | null,
) {
  const current = await prisma.attempt_results.findUnique({
    where: {
      attempt_id: attemptId,
    },
  });

  if (current) {
    const summaryJson =
      current.summary_json && typeof current.summary_json === "object"
        ? {
            ...(current.summary_json as Record<string, unknown>),
            ...patch,
          }
        : patch;

    await prisma.attempt_results.update({
      where: {
        attempt_id: attemptId,
      },
      data: {
        summary_json: json(summaryJson),
        band_estimate:
          bandEstimate !== undefined ? bandEstimate : current.band_estimate,
        updated_at: new Date(),
      },
    });

    return;
  }

  await prisma.attempt_results.create({
    data: {
      attempt_id: attemptId,
      correct_count: null,
      total_count: null,
      raw_score: null,
      band_estimate: bandEstimate ?? null,
      summary_json: json(patch),
    },
  });
}

async function finalizeAttemptIfAutomatedDone(attemptId: string) {
  const attempt = await prisma.attempts.findUnique({
    where: {
      id: attemptId,
    },
    include: {
      ai_gradings: true,
      asr_jobs: true,
    },
  });

  if (!attempt || attempt.status !== attempt_status.GRADING) {
    return;
  }

  const hasError =
    attempt.ai_gradings.some(
      (item) => item.status === grading_job_status.ERROR,
    ) ||
    attempt.asr_jobs.some((item) => item.status === grading_job_status.ERROR);

  if (hasError) {
    await prisma.attempts.update({
      where: {
        id: attemptId,
      },
      data: {
        status: attempt_status.ERROR,
        updated_at: new Date(),
      },
    });

    return;
  }

  const hasPending =
    attempt.ai_gradings.some(
      (item) =>
        item.status === grading_job_status.PENDING ||
        item.status === grading_job_status.RUNNING,
    ) ||
    attempt.asr_jobs.some(
      (item) =>
        item.status === grading_job_status.PENDING ||
        item.status === grading_job_status.RUNNING,
    );

  if (hasPending) {
    return;
  }

  await prisma.attempts.update({
    where: {
      id: attemptId,
    },
    data: {
      status: attempt_status.GRADED,
      graded_at: new Date(),
      updated_at: new Date(),
    },
  });
}

async function markAiFailure(params: {
  job: Job<AiGradingJobData>;
  aiGradingId: string;
  error: unknown;
}) {
  const isFinal = isFinalAttempt(params.job);
  const message =
    params.error instanceof Error ? params.error.message : String(params.error);

  await prisma.$transaction(async (tx) => {
    await tx.ai_gradings.update({
      where: {
        id: params.aiGradingId,
      },
      data: {
        status: isFinal ? grading_job_status.ERROR : grading_job_status.PENDING,
        error_message: message,
        finished_at: isFinal ? new Date() : null,
        retry_count: {
          increment: 1,
        },
      },
    });

    if (isFinal) {
      await tx.attempts.update({
        where: {
          id: params.job.data.attemptId,
        },
        data: {
          status: attempt_status.ERROR,
          updated_at: new Date(),
        },
      });
    }
  });
}

export async function processWritingAiGrading(job: Job<AiGradingJobData>) {
  const { attemptId, aiGradingId } = job.data;

  const aiJob = await findAiJob({
    aiGradingId,
    attemptId,
    skill: test_type.WRITING,
  });

  if (!aiJob) {
    throw new Error(
      `Writing AI grading job not found for attempt ${attemptId}`,
    );
  }

  await prisma.ai_gradings.update({
    where: {
      id: aiJob.id,
    },
    data: {
      status: grading_job_status.RUNNING,
      started_at: new Date(),
      finished_at: null,
      error_message: null,
    },
  });

  try {
    const attempt = await prisma.attempts.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        attempt_snapshots: true,
        attempt_writing_responses: true,
      },
    });

    if (!attempt || !attempt.attempt_snapshots) {
      throw new Error("Attempt or snapshot not found");
    }

    if (attempt.status !== attempt_status.GRADING) {
      throw new Error(`Attempt ${attemptId} is not in GRADING status`);
    }

    const snapshot = attempt.attempt_snapshots.test_snapshot_json as any;
    const writingSections = (snapshot.sections ?? []).filter(
      (section: any) => !!section.writingTask,
    );

    const responses = attempt.attempt_writing_responses.map((item) => ({
      writingTaskId: item.writing_task_id,
      responseText: item.response_text || "",
      wordCount: item.word_count || 0,
    }));

    if (responses.length === 0) {
      throw new Error("No writing response found for grading");
    }

    const promptData = JSON.stringify(
      {
        sections: writingSections.map((section: any) => ({
          partLabel: section.partLabel,
          writingTask: section.writingTask,
        })),
        responses,
      },
      null,
      2,
    );

    const ai = await generateGeminiJson<WritingAiResult>({
      systemInstruction:
        "You are a strict IELTS Writing examiner. Return only valid JSON. Score using official IELTS Writing criteria. Bands must be numbers between 0 and 9.",
      schemaHint:
        '{"overallBand":number,"taskAchievement":number,"coherenceCohesion":number,"lexicalResource":number,"grammaticalRangeAccuracy":number,"summary":string,"actionItems":string[]}',
      prompt: `Evaluate this IELTS Writing submission.\n\nData:\n${promptData}`,
    });

    validateWritingResult(ai.data);

    await prisma.ai_gradings.update({
      where: {
        id: aiJob.id,
      },
      data: {
        status: grading_job_status.DONE,
        response_json: json(ai.raw),
        normalized_result_json: json(ai.data),
        error_message: null,
        finished_at: new Date(),
      },
    });

    await upsertAttemptSummaryJson(
      attemptId,
      {
        writingAi: ai.data,
      },
      ai.data.overallBand,
    );

    await finalizeAttemptIfAutomatedDone(attemptId);

    return ai.data;
  } catch (error) {
    await markAiFailure({
      job,
      aiGradingId: aiJob.id,
      error,
    });

    throw error;
  }
}

export async function processSpeakingAiGrading(job: Job<AiGradingJobData>) {
  const { attemptId, aiGradingId } = job.data;

  const aiJob = await findAiJob({
    aiGradingId,
    attemptId,
    skill: test_type.SPEAKING,
  });

  if (!aiJob) {
    throw new Error(
      `Speaking AI grading job not found for attempt ${attemptId}`,
    );
  }

  await prisma.ai_gradings.update({
    where: {
      id: aiJob.id,
    },
    data: {
      status: grading_job_status.RUNNING,
      started_at: new Date(),
      finished_at: null,
      error_message: null,
    },
  });

  try {
    const attempt = await prisma.attempts.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        attempt_snapshots: true,
        attempt_speaking_responses: {
          orderBy: {
            speaking_part: "asc",
          },
        },
      },
    });

    if (!attempt || !attempt.attempt_snapshots) {
      throw new Error("Attempt or snapshot not found");
    }

    if (attempt.status !== attempt_status.GRADING) {
      throw new Error(`Attempt ${attemptId} is not in GRADING status`);
    }

    const missingTranscript = attempt.attempt_speaking_responses.find(
      (item) =>
        item.asr_status !== grading_job_status.DONE || !item.transcript?.trim(),
    );

    if (missingTranscript) {
      throw new Error(
        `Speaking transcript is not ready for ${missingTranscript.speaking_part}`,
      );
    }

    const snapshot = attempt.attempt_snapshots.test_snapshot_json as any;
    const speakingSections = (snapshot.sections ?? []).filter(
      (section: any) => !!section.speakingSet,
    );

    const responses = attempt.attempt_speaking_responses.map((item) => ({
      speakingPart: item.speaking_part,
      promptId: item.prompt_id,
      transcript: item.transcript || "",
      durationSec: item.duration_sec,
      whisperMeta: item.whisper_response_json
        ? {
            duration: (item.whisper_response_json as any)?.duration ?? null,
            language: (item.whisper_response_json as any)?.language ?? null,
            segmentCount: Array.isArray(
              (item.whisper_response_json as any)?.segments,
            )
              ? (item.whisper_response_json as any).segments.length
              : null,
          }
        : null,
    }));

    if (responses.length === 0) {
      throw new Error("No speaking response found for grading");
    }

    const promptData = JSON.stringify(
      {
        sections: speakingSections.map((section: any) => ({
          partLabel: section.partLabel,
          speakingSet: section.speakingSet,
        })),
        responses,
      },
      null,
      2,
    );

    const ai = await generateGeminiJson<SpeakingAiResult>({
      systemInstruction:
        "You are a strict IELTS Speaking examiner. Return only valid JSON. Score using official IELTS Speaking criteria. Bands must be numbers between 0 and 9.",
      schemaHint:
        '{"overallBand":number,"fluencyCoherence":number,"lexicalResource":number,"grammaticalRangeAccuracy":number,"pronunciation":number,"summary":string,"actionItems":string[]}',
      prompt: `Evaluate this IELTS Speaking submission. Use the transcripts and prompt context.\n\nData:\n${promptData}`,
    });

    validateSpeakingResult(ai.data);

    await prisma.ai_gradings.update({
      where: {
        id: aiJob.id,
      },
      data: {
        status: grading_job_status.DONE,
        response_json: json(ai.raw),
        normalized_result_json: json(ai.data),
        error_message: null,
        finished_at: new Date(),
      },
    });

    await upsertAttemptSummaryJson(
      attemptId,
      {
        speakingAi: ai.data,
      },
      ai.data.overallBand,
    );

    await finalizeAttemptIfAutomatedDone(attemptId);

    return ai.data;
  } catch (error) {
    await markAiFailure({
      job,
      aiGradingId: aiJob.id,
      error,
    });

    throw error;
  }
}
