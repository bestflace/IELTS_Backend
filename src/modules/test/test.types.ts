export type TestListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  type?: "READING" | "LISTENING" | "WRITING" | "SPEAKING" | "FULL";
  level?: number;
  tagIds?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  sort?: "published_at_desc";
};

export type TestSectionInput = {
  sectionType:
    | "READING_SET"
    | "LISTENING_SET"
    | "WRITING_TASK"
    | "SPEAKING_SET";
  readingSetId?: string;
  listeningSetId?: string;
  writingTaskId?: string;
  speakingSetId?: string;
  partLabel?: string | null;
  sortOrder: number;
  timeLimitSec?: number | null;
};

export type CreateTestBody = {
  id: string;
  type: "READING" | "LISTENING" | "WRITING" | "SPEAKING" | "FULL";
  title: string;
  level?: number | null;
  description?: string | null;
  tagIds?: string[];
  sections?: TestSectionInput[];
  publishNow?: boolean;
};

export type UpdateTestBody = {
  title?: string;
  level?: number | null;
  description?: string | null;
  tagIds?: string[];
};

export type ReplaceSectionsBody = {
  sections: TestSectionInput[];
};

export type UpdateTestSectionBody = {
  sectionType?:
    | "READING_SET"
    | "LISTENING_SET"
    | "WRITING_TASK"
    | "SPEAKING_SET";
  readingSetId?: string | null;
  listeningSetId?: string | null;
  writingTaskId?: string | null;
  speakingSetId?: string | null;
  partLabel?: string | null;
  sortOrder?: number;
  timeLimitSec?: number | null;
};

export type BuilderRule = {
  levelMin?: number;
  levelMax?: number;
  tagIds?: string[];
};

export type RandomBuildBody = {
  id?: string;
  type: "READING" | "LISTENING" | "WRITING" | "SPEAKING" | "FULL";
  title: string;
  level?: number | null;
  description?: string | null;
  tagIds?: string[];
  publishNow?: boolean;
  rules?: {
    reading?: BuilderRule;
    listening?: BuilderRule;
    writing?: BuilderRule;
    speaking?: BuilderRule;
    avoidUsedIds?: string[];
  };
};
