export type WritingTaskListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  level?: number;
  tagIds?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  taskNo?: number;
};

export type CreateWritingTaskBody = {
  id: string;
  taskNo?: number | null;
  title: string;
  promptText: string;
  chartUrl?: string | null;
  imageUrl?: string | null;
  level?: number | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tagIds?: string[];
};

export type UpdateWritingTaskBody = {
  taskNo?: number | null;
  title?: string;
  promptText?: string;
  chartUrl?: string | null;
  imageUrl?: string | null;
  level?: number | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tagIds?: string[];
};
