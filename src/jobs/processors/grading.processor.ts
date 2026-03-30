import { prisma } from "../../config/prisma";
import { generateGeminiJson } from "../../config/ai";

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

async function upsertAttemptSummaryJson(
  attemptId: string,
  patch: Record<string, unknown>,
) {
  const current = await prisma.attempt_results.findUnique({
    where: { attempt_id: attemptId },
  });

  if (current) {
    const summaryJson =
      current.summary_json && typeof current.summary_json === "object"
        ? { ...(current.summary_json as any), ...patch }
        : patch;

    await prisma.attempt_results.update({
      where: { attempt_id: attemptId },
      data: {
        summary_json: summaryJson as any,
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
      band_estimate: null,
      summary_json: patch as any,
    },
  });
}

async function finalizeAttemptIfPossible(attemptId: string) {
  const remainingTeacher = await prisma.teacher_submissions.count({
    where: {
      attempt_id: attemptId,
      status: {
        not: "REVIEWED",
      },
    },
  });

  if (remainingTeacher > 0) {
    return;
  }

  await prisma.attempts.update({
    where: { id: attemptId },
    data: {
      status: "GRADED",
      graded_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function processWritingAiGrading(attemptId: string) {
  const job = await prisma.ai_gradings.findFirst({
    where: {
      attempt_id: attemptId,
      skill: "WRITING",
    },
    orderBy: {
      created_at: "desc",
    },
  });

  if (!job) {
    throw new Error(
      `Writing AI grading job not found for attempt ${attemptId}`,
    );
  }

  await prisma.ai_gradings.update({
    where: { id: job.id },
    data: {
      status: "RUNNING",
      started_at: new Date(),
      error_message: null,
    },
  });

  try {
    const attempt = await prisma.attempts.findUnique({
      where: { id: attemptId },
      include: {
        attempt_snapshots: true,
        attempt_writing_responses: true,
      },
    });

    if (!attempt || !attempt.attempt_snapshots) {
      throw new Error("Attempt or snapshot not found");
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

    const prompt = JSON.stringify(
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
        "You are an IELTS Writing examiner. Return only valid JSON. Score strictly on IELTS criteria.",
      prompt: `
Evaluate this IELTS writing submission and return JSON with:
overallBand, taskAchievement, coherenceCohesion, lexicalResource, grammaticalRangeAccuracy, summary, actionItems.

Data:
${prompt}
      `.trim(),
    });

    await prisma.ai_gradings.update({
      where: { id: job.id },
      data: {
        status: "DONE",
        response_json: ai.raw as any,
        normalized_result_json: ai.data as any,
        finished_at: new Date(),
      },
    });

    await upsertAttemptSummaryJson(attemptId, {
      writingAi: ai.data,
    });

    await finalizeAttemptIfPossible(attemptId);

    return ai.data;
  } catch (error) {
    await prisma.ai_gradings.update({
      where: { id: job.id },
      data: {
        status: "ERROR",
        error_message: (error as Error).message,
        finished_at: new Date(),
        retry_count: {
          increment: 1,
        },
      },
    });

    throw error;
  }
}

export async function processSpeakingAiGrading(attemptId: string) {
  const job = await prisma.ai_gradings.findFirst({
    where: {
      attempt_id: attemptId,
      skill: "SPEAKING",
    },
    orderBy: {
      created_at: "desc",
    },
  });

  if (!job) {
    throw new Error(
      `Speaking AI grading job not found for attempt ${attemptId}`,
    );
  }

  await prisma.ai_gradings.update({
    where: { id: job.id },
    data: {
      status: "RUNNING",
      started_at: new Date(),
      error_message: null,
    },
  });

  try {
    const attempt = await prisma.attempts.findUnique({
      where: { id: attemptId },
      include: {
        attempt_snapshots: true,
        attempt_speaking_responses: true,
      },
    });

    if (!attempt || !attempt.attempt_snapshots) {
      throw new Error("Attempt or snapshot not found");
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
    }));

    const prompt = JSON.stringify(
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
        "You are an IELTS Speaking examiner. Return only valid JSON. Score strictly on IELTS criteria.",
      prompt: `
Evaluate this IELTS speaking submission and return JSON with:
overallBand, fluencyCoherence, lexicalResource, grammaticalRangeAccuracy, pronunciation, summary, actionItems.

Data:
${prompt}
      `.trim(),
    });

    await prisma.ai_gradings.update({
      where: { id: job.id },
      data: {
        status: "DONE",
        response_json: ai.raw as any,
        normalized_result_json: ai.data as any,
        finished_at: new Date(),
      },
    });

    await upsertAttemptSummaryJson(attemptId, {
      speakingAi: ai.data,
    });

    await finalizeAttemptIfPossible(attemptId);

    return ai.data;
  } catch (error) {
    await prisma.ai_gradings.update({
      where: { id: job.id },
      data: {
        status: "ERROR",
        error_message: (error as Error).message,
        finished_at: new Date(),
        retry_count: {
          increment: 1,
        },
      },
    });

    throw error;
  }
}
