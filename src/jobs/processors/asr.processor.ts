import path from "path";
import { Job } from "bullmq";
import {
  Prisma,
  attempt_status,
  grading_job_status,
  test_type,
  transcript_source,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { transcribeWithWhisper } from "../../config/ai";
import { downloadR2ObjectToBuffer } from "../../config/r2";
import { SpeakingAsrJobData } from "../queues/asr.queue";
import { enqueueSpeakingAiGrading } from "../queues/grading.queue";

const MAX_AUDIO_BYTES = Number(
  process.env.ASR_MAX_AUDIO_BYTES || 25 * 1024 * 1024,
);

const AUDIO_DOWNLOAD_TIMEOUT_MS = Number(
  process.env.ASR_AUDIO_DOWNLOAD_TIMEOUT_MS || 60_000,
);

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function inferMimeTypeFromUrl(url: string) {
  const lower = url.toLowerCase().split("?")[0];

  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".ogg")) return "audio/ogg";

  return "application/octet-stream";
}

function basenameFromUrl(url: string, fallback: string) {
  try {
    const name = path.basename(new URL(url).pathname);
    return name || fallback;
  } catch {
    return fallback;
  }
}

function isFinalAttempt(job: Job) {
  const maxAttempts = Number(job.opts.attempts || 1);
  return job.attemptsMade + 1 >= maxAttempts;
}

async function fetchAudioUrlToBuffer(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    AUDIO_DOWNLOAD_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Cannot download audio URL: ${response.status} ${response.statusText}`,
      );
    }

    const contentLength = Number(response.headers.get("content-length") || 0);

    if (contentLength > MAX_AUDIO_BYTES) {
      throw new Error(`Audio URL is too large for ASR: ${contentLength} bytes`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length > MAX_AUDIO_BYTES) {
      throw new Error(`Audio URL exceeded ASR size limit: ${buffer.length}`);
    }

    return {
      buffer,
      contentType: response.headers.get("content-type"),
      contentLength: contentLength || buffer.length,
      eTag: response.headers.get("etag"),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function markAsrFailure(params: {
  job: Job<SpeakingAsrJobData>;
  error: unknown;
}) {
  const { job, error } = params;
  const isFinal = isFinalAttempt(job);
  const message = error instanceof Error ? error.message : String(error);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.asr_jobs.update({
      where: {
        id: job.data.asrJobId,
      },
      data: {
        status: isFinal ? grading_job_status.ERROR : grading_job_status.PENDING,
        error_message: message,
        finished_at: isFinal ? now : null,
        retry_count: {
          increment: 1,
        },
      },
    });

    await tx.attempt_speaking_responses.update({
      where: {
        id: job.data.speakingResponseId,
      },
      data: {
        asr_status: isFinal
          ? grading_job_status.ERROR
          : grading_job_status.PENDING,
        asr_error_message: message,
        asr_finished_at: isFinal ? now : null,
      },
    });

    if (isFinal) {
      await tx.attempts.update({
        where: {
          id: job.data.attemptId,
        },
        data: {
          status: attempt_status.ERROR,
          updated_at: now,
        },
      });
    }
  });
}

async function maybeEnqueueSpeakingAiGrading(attemptId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const failedCount = await tx.attempt_speaking_responses.count({
      where: {
        attempt_id: attemptId,
        asr_status: grading_job_status.ERROR,
      },
    });

    if (failedCount > 0) {
      await tx.attempts.update({
        where: {
          id: attemptId,
        },
        data: {
          status: attempt_status.ERROR,
          updated_at: new Date(),
        },
      });

      return null;
    }

    const unfinishedCount = await tx.attempt_speaking_responses.count({
      where: {
        attempt_id: attemptId,
        OR: [
          {
            asr_status: {
              not: grading_job_status.DONE,
            },
          },
          {
            transcript: null,
          },
        ],
      },
    });

    if (unfinishedCount > 0) {
      return null;
    }

    await tx.ai_gradings.createMany({
      data: [
        {
          attempt_id: attemptId,
          skill: test_type.SPEAKING,
          provider: "GEMINI",
          status: grading_job_status.PENDING,
          request_json: json({
            source: "ASR_DONE",
          }),
        },
      ],
      skipDuplicates: true,
    });

    const aiJob = await tx.ai_gradings.findFirst({
      where: {
        attempt_id: attemptId,
        skill: test_type.SPEAKING,
        provider: "GEMINI",
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return aiJob
      ? {
          aiGradingId: aiJob.id,
        }
      : null;
  });

  if (result?.aiGradingId) {
    await enqueueSpeakingAiGrading({
      attemptId,
      aiGradingId: result.aiGradingId,
    });
  }
}

export async function processSpeakingAsr(job: Job<SpeakingAsrJobData>) {
  const { attemptId, asrJobId, speakingResponseId } = job.data;
  const startedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.asr_jobs.update({
      where: {
        id: asrJobId,
      },
      data: {
        status: grading_job_status.RUNNING,
        started_at: startedAt,
        finished_at: null,
        error_message: null,
        bull_job_id: job.id,
      },
    });

    await tx.attempt_speaking_responses.update({
      where: {
        id: speakingResponseId,
      },
      data: {
        asr_status: grading_job_status.RUNNING,
        asr_started_at: startedAt,
        asr_finished_at: null,
        asr_error_message: null,
      },
    });
  });

  try {
    const response = await prisma.attempt_speaking_responses.findUnique({
      where: {
        id: speakingResponseId,
      },
      include: {
        attempts: true,
      },
    });

    if (!response || response.attempt_id !== attemptId) {
      throw new Error(
        `Speaking response ${speakingResponseId} not found for attempt ${attemptId}`,
      );
    }

    if (response.attempts.status !== attempt_status.GRADING) {
      throw new Error(`Attempt ${attemptId} is not in GRADING status`);
    }

    const fallbackFilename = `${response.speaking_part}.webm`;

    const audio = response.audio_file_key
      ? await downloadR2ObjectToBuffer({
          fileKey: response.audio_file_key,
          maxBytes: MAX_AUDIO_BYTES,
        })
      : await fetchAudioUrlToBuffer(response.audio_url);

    const mimeType =
      response.audio_mime_type ||
      audio.contentType ||
      inferMimeTypeFromUrl(response.audio_url);

    const filename = response.audio_file_key
      ? path.basename(response.audio_file_key) || fallbackFilename
      : basenameFromUrl(response.audio_url, fallbackFilename);

    const transcription = await transcribeWithWhisper({
      audioBuffer: audio.buffer,
      filename,
      mimeType,
      language: process.env.WHISPER_LANGUAGE?.trim() || "en",
    });

    if (!transcription.text.trim()) {
      throw new Error("Whisper returned empty transcript");
    }

    const finishedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.attempt_speaking_responses.update({
        where: {
          id: response.id,
        },
        data: {
          transcript: transcription.text,
          transcript_source: transcript_source.WHISPER,
          whisper_response_json: json(transcription.raw),
          asr_status: grading_job_status.DONE,
          asr_error_message: null,
          asr_finished_at: finishedAt,
          audio_mime_type:
            response.audio_mime_type || audio.contentType || null,
          audio_size_bytes:
            response.audio_size_bytes ??
            BigInt(audio.contentLength || audio.buffer.length),
          audio_etag: response.audio_etag || audio.eTag || null,
        },
      });

      await tx.asr_jobs.update({
        where: {
          id: asrJobId,
        },
        data: {
          status: grading_job_status.DONE,
          response_json: json({
            success: true,
            attemptId,
            speakingResponseId: response.id,
            speakingPart: response.speaking_part,
            filename,
            mimeType,
            audioBytes: audio.buffer.length,
            textLength: transcription.text.length,
          }),
          error_message: null,
          finished_at: finishedAt,
        },
      });
    });

    await maybeEnqueueSpeakingAiGrading(attemptId);

    return {
      success: true,
      attemptId,
      speakingResponseId,
      textLength: transcription.text.length,
    };
  } catch (error) {
    await markAsrFailure({
      job,
      error,
    });

    throw error;
  }
}
