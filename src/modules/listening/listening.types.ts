export type ListeningSetListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  level?: number;
  tagIds?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export type CreateListeningSetBody = {
  id: string;
  title: string;
  transcriptText?: string | null;
  audioUrl?: string | null;
  audioSource?: "UPLOAD" | "URL" | "R2" | null;
  level: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tagIds?: string[];
};

export type UpdateListeningSetBody = {
  title?: string;
  transcriptText?: string | null;
  audioUrl?: string | null;
  audioSource?: "UPLOAD" | "URL" | "R2" | null;
  level?: number | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tagIds?: string[];
};

export type CreateListeningQuestionBody = {
  qNo: number;
  sectionLabel?: string | null;
  questionType: string;
  promptText: string;
  instructionText?: string | null;
  optionsJson?: unknown;
  correctAnswerJson: unknown;
  explanation?: string | null;
  points?: number;
  sortOrder: number;
};

export type UpdateListeningQuestionBody = {
  qNo?: number;
  sectionLabel?: string | null;
  questionType?: string;
  promptText?: string;
  instructionText?: string | null;
  optionsJson?: unknown;
  correctAnswerJson?: unknown;
  explanation?: string | null;
  points?: number;
  sortOrder?: number;
};
