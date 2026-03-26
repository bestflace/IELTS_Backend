export type SpeakingSetListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  level?: number;
  tagIds?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export type CreateSpeakingSetBody = {
  id: string;
  topic: string;
  level: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tagIds?: string[];
};

export type UpdateSpeakingSetBody = {
  topic?: string | null;
  level?: number | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  tagIds?: string[];
};

export type CreateSpeakingPartBody = {
  partType: "PART_1" | "PART_2" | "PART_3";
  title?: string | null;
  instructions?: string | null;
  recommendedSec?: number | null;
  sortOrder: number;
};

export type UpdateSpeakingPartBody = {
  partType?: "PART_1" | "PART_2" | "PART_3";
  title?: string | null;
  instructions?: string | null;
  recommendedSec?: number | null;
  sortOrder?: number;
};

export type CreateSpeakingPromptBody = {
  promptType: "QUESTION" | "CUE_CARD" | "FOLLOW_UP" | "TOPIC" | "INTRO";
  content: string;
  notes?: string | null;
  timeSuggestSec?: number | null;
  sortOrder: number;
};

export type UpdateSpeakingPromptBody = {
  promptType?: "QUESTION" | "CUE_CARD" | "FOLLOW_UP" | "TOPIC" | "INTRO";
  content?: string;
  notes?: string | null;
  timeSuggestSec?: number | null;
  sortOrder?: number;
};

export type CreateSpeakingPromptItemBody = {
  itemText: string;
  sortOrder: number;
};

export type UpdateSpeakingPromptItemBody = {
  itemText?: string;
  sortOrder?: number;
};
