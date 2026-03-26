import { z } from "zod";

const speakingSetIdSchema = z.string().trim().min(1).max(32);
const uuidSchema = z.string().uuid();

const levelQuerySchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().min(0).max(9).optional());

const pageSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().optional());

const limitSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().max(100).optional());

const tagIdsQuerySchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}, z.array(z.string().uuid()).optional());

const bandScoreSchema = z.number().min(0).max(9);

const positiveIntSchema = z.number().int().positive();

export const publicSpeakingSetListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().optional(),
  level: levelQuerySchema,
  tagIds: tagIdsQuerySchema,
});

export const adminSpeakingSetListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().optional(),
  level: levelQuerySchema,
  tagIds: tagIdsQuerySchema,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const speakingSetIdParamsSchema = z.object({
  id: speakingSetIdSchema,
});

export const createSpeakingSetSchema = z.object({
  id: speakingSetIdSchema,
  topic: z.string().trim().min(1).max(255),
  level: bandScoreSchema,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  tagIds: z.array(uuidSchema).optional(),
});

export const updateSpeakingSetSchema = z
  .object({
    topic: z.string().trim().min(1).max(255).nullable().optional(),
    level: bandScoreSchema.nullable().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    tagIds: z.array(uuidSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
    path: ["topic"],
  });

export const speakingPartIdParamsSchema = z.object({
  partId: uuidSchema,
});

export const createSpeakingPartSchema = z.object({
  partType: z.enum(["PART_1", "PART_2", "PART_3"]),
  title: z.string().trim().min(1).max(255).nullable().optional(),
  instructions: z.string().trim().min(1).nullable().optional(),
  recommendedSec: positiveIntSchema.nullable().optional(),
  sortOrder: positiveIntSchema,
});

export const updateSpeakingPartSchema = z
  .object({
    partType: z.enum(["PART_1", "PART_2", "PART_3"]).optional(),
    title: z.string().trim().min(1).max(255).nullable().optional(),
    instructions: z.string().trim().min(1).nullable().optional(),
    recommendedSec: positiveIntSchema.nullable().optional(),
    sortOrder: positiveIntSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
    path: ["partType"],
  });

export const speakingPromptIdParamsSchema = z.object({
  promptId: uuidSchema,
});

export const createSpeakingPromptSchema = z.object({
  promptType: z.enum(["QUESTION", "CUE_CARD", "FOLLOW_UP", "TOPIC", "INTRO"]),
  content: z.string().trim().min(1),
  notes: z.string().trim().min(1).nullable().optional(),
  timeSuggestSec: positiveIntSchema.nullable().optional(),
  sortOrder: positiveIntSchema,
});

export const updateSpeakingPromptSchema = z
  .object({
    promptType: z
      .enum(["QUESTION", "CUE_CARD", "FOLLOW_UP", "TOPIC", "INTRO"])
      .optional(),
    content: z.string().trim().min(1).optional(),
    notes: z.string().trim().min(1).nullable().optional(),
    timeSuggestSec: positiveIntSchema.nullable().optional(),
    sortOrder: positiveIntSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
    path: ["promptType"],
  });

export const speakingPromptItemIdParamsSchema = z.object({
  itemId: uuidSchema,
});

export const createSpeakingPromptItemSchema = z.object({
  itemText: z.string().trim().min(1),
  sortOrder: positiveIntSchema,
});

export const updateSpeakingPromptItemSchema = z
  .object({
    itemText: z.string().trim().min(1).optional(),
    sortOrder: positiveIntSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
    path: ["itemText"],
  });
