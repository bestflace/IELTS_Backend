export type CreateAttemptBody = {
  testId: string;
  mode: "READING" | "LISTENING" | "WRITING" | "SPEAKING" | "FULL";
  partLabel?: string | null;
  timeLimitSec?: number;
};

export type AttemptListQuery = {
  page?: number;
  limit?: number;
  mode?: "READING" | "LISTENING" | "WRITING" | "SPEAKING" | "FULL";
  status?:
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "GRADING"
    | "GRADED"
    | "ERROR"
    | "EXPIRED";
  from?: string;
  to?: string;
};

export type SaveQuestionAnswerItem = {
  questionId: string;
  qNo?: number;
  answerJson?: unknown;
  isFlagged?: boolean;
  isFinal?: boolean;
};

export type PatchQuestionAnswerBody = {
  qNo?: number;
  answerJson?: unknown;
  isFlagged?: boolean;
  isFinal?: boolean;
};

export type SaveWritingResponseItem = {
  writingTaskId: string;
  responseText: string;
};

export type SaveSpeakingResponseItem = {
  speakingPart: "PART_1" | "PART_2" | "PART_3";
  promptId?: string | null;

  audioUrl: string;
  audioFileKey: string;
  audioMimeType: string;
  audioSizeBytes: number;
  audioETag?: string | null;

  durationSec?: number | null;
};

export type PatchSpeakingResponseBody = {
  promptId?: string | null;

  audioUrl?: string | null;
  audioFileKey?: string | null;
  audioMimeType?: string | null;
  audioSizeBytes?: number | null;
  audioETag?: string | null;

  durationSec?: number | null;
};

export type SubmitAttemptBody = {
  force?: boolean;
};
