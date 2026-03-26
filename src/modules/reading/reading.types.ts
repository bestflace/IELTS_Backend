export type ReadingSetListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  level?: number;
  tagIds?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export type CreateReadingSetBody = {
  id: string;
  title: string;
  passageHtml?: string | null;
  passageText?: string | null;
  level: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tagIds?: string[];
};

export type UpdateReadingSetBody = {
  title?: string;
  passageHtml?: string | null;
  passageText?: string | null;
  level?: number | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tagIds?: string[];
};

export type CreateReadingQuestionBody = {
  qNo: number;
  questionType: string;
  promptText: string;
  instructionText?: string | null;
  optionsJson?: unknown;
  correctAnswerJson: unknown;
  explanation?: string | null;
  points?: number;
  sortOrder: number;
};

export type UpdateReadingQuestionBody = {
  qNo?: number;
  questionType?: string;
  promptText?: string;
  instructionText?: string | null;
  optionsJson?: unknown;
  correctAnswerJson?: unknown;
  explanation?: string | null;
  points?: number;
  sortOrder?: number;
};
