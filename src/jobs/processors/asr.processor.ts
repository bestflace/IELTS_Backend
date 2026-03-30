import path from "path";
import { prisma } from "../../config/prisma";
import { transcribeWithWhisper } from "../../config/ai";
import { enqueueSpeakingAiGrading } from "../queues";

function inferMimeTypeFromUrl(url: string) {
  const lower = url.toLowerCase();
  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  return "application/octet-stream";
}

export async function processSpeakingAsr(attemptId: string) {
  const asrJob = await prisma.asr_jobs.findFirst({
    where: {
      attempt_id: attemptId,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  if (!asrJob) {
    throw new Error(`ASR job not found for attempt ${attemptId}`);
  }

  await prisma.asr_jobs.update({
    where: { id: asrJob.id },
    data: {
      status: "RUNNING",
      started_at: new Date(),
      error_message: null,
    },
  });

  try {
    const responses = await prisma.attempt_speaking_responses.findMany({
      where: {
        attempt_id: attemptId,
      },
      orderBy: {
        speaking_part: "asc",
      },
    });

    for (const response of responses) {
      const fetchResponse = await fetch(response.audio_url);

      if (!fetchResponse.ok) {
        throw new Error(`Cannot download audio: ${response.audio_url}`);
      }

      const audioBuffer = Buffer.from(await fetchResponse.arrayBuffer());
      const mimeType =
        fetchResponse.headers.get("content-type") ||
        inferMimeTypeFromUrl(response.audio_url);
      const filename =
        path.basename(new URL(response.audio_url).pathname) ||
        `${response.speaking_part}.webm`;

      const transcription = await transcribeWithWhisper({
        audioBuffer,
        filename,
        mimeType,
      });

      await prisma.attempt_speaking_responses.update({
        where: { id: response.id },
        data: {
          transcript: transcription.text,
        },
      });
    }

    await prisma.asr_jobs.update({
      where: { id: asrJob.id },
      data: {
        status: "DONE",
        response_json: {
          success: true,
        } as any,
        finished_at: new Date(),
      },
    });

    await enqueueSpeakingAiGrading(attemptId);

    return { success: true };
  } catch (error) {
    await prisma.asr_jobs.update({
      where: { id: asrJob.id },
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
