import { z } from "zod";

const testIdSchema = z.string().trim().min(1).max(32);
const uuidSchema = z.string().uuid();

const pageSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().optional());

const limitSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().max(100).optional());

const levelSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().min(0).max(9).optional());

const levelNullableSchema = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return Number(value);
}, z.number().min(0).max(9).nullable().optional());

const positiveIntSchema = z.number().int().positive();
const positiveIntNullableSchema = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return Number(value);
}, z.number().int().positive().nullable().optional());

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

const testTypeSchema = z.enum([
  "READING",
  "LISTENING",
  "WRITING",
  "SPEAKING",
  "FULL",
]);
const testSectionTypeSchema = z.enum([
  "READING_SET",
  "LISTENING_SET",
  "WRITING_TASK",
  "SPEAKING_SET",
]);

const testSectionInputSchema = z
  .object({
    sectionType: testSectionTypeSchema,
    readingSetId: z.string().trim().min(1).max(32).optional(),
    listeningSetId: z.string().trim().min(1).max(32).optional(),
    writingTaskId: z.string().trim().min(1).max(32).optional(),
    speakingSetId: z.string().trim().min(1).max(32).optional(),
    partLabel: z.string().trim().min(1).max(20).nullable().optional(),
    sortOrder: positiveIntSchema,
    timeLimitSec: positiveIntNullableSchema,
  })
  .superRefine((data, ctx) => {
    const keys = {
      READING_SET: data.readingSetId,
      LISTENING_SET: data.listeningSetId,
      WRITING_TASK: data.writingTaskId,
      SPEAKING_SET: data.speakingSetId,
    } as const;

    const required = keys[data.sectionType];
    if (!required) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sectionType"],
        message: "Section source id is required for the selected section type",
      });
    }

    const usedCount = [
      data.readingSetId,
      data.listeningSetId,
      data.writingTaskId,
      data.speakingSetId,
    ].filter(Boolean).length;

    if (usedCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sectionType"],
        message: "Exactly one section source id must be provided",
      });
    }
  });

const updateTestSectionSchemaBase = z
  .object({
    sectionType: testSectionTypeSchema.optional(),
    readingSetId: z.string().trim().min(1).max(32).nullable().optional(),
    listeningSetId: z.string().trim().min(1).max(32).nullable().optional(),
    writingTaskId: z.string().trim().min(1).max(32).nullable().optional(),
    speakingSetId: z.string().trim().min(1).max(32).nullable().optional(),
    partLabel: z.string().trim().min(1).max(20).nullable().optional(),
    sortOrder: positiveIntSchema.optional(),
    timeLimitSec: positiveIntNullableSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
    path: ["sectionType"],
  });

const builderRuleSchema = z.object({
  levelMin: levelSchema,
  levelMax: levelSchema,
  tagIds: z.array(uuidSchema).optional(),
});

export const publicTestListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().optional(),
  type: testTypeSchema.optional(),
  level: levelSchema,
  tagIds: tagIdsQuerySchema,
  sort: z.enum(["published_at_desc"]).optional(),
});

export const adminTestListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().optional(),
  type: testTypeSchema.optional(),
  level: levelSchema,
  tagIds: tagIdsQuerySchema,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const testIdParamsSchema = z.object({
  id: testIdSchema,
});

export const testSectionIdParamsSchema = z.object({
  sectionId: uuidSchema,
});

export const createTestSchema = z.object({
  id: testIdSchema,
  type: testTypeSchema,
  title: z.string().trim().min(1).max(255),
  level: levelNullableSchema,
  description: z.string().trim().min(1).nullable().optional(),
  tagIds: z.array(uuidSchema).optional(),
  sections: z.array(testSectionInputSchema).optional(),
  publishNow: z.boolean().optional(),
});

export const updateTestSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    level: levelNullableSchema,
    description: z.string().trim().min(1).nullable().optional(),
    tagIds: z.array(uuidSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
    path: ["title"],
  });

export const replaceSectionsSchema = z.object({
  sections: z.array(testSectionInputSchema).min(1),
});

export const addTestSectionSchema = testSectionInputSchema;
export const updateTestSectionSchema = updateTestSectionSchemaBase;

export const randomBuildSchema = z.object({
  id: testIdSchema.optional(),
  type: testTypeSchema,
  title: z.string().trim().min(1).max(255),
  level: levelNullableSchema,
  description: z.string().trim().min(1).nullable().optional(),
  tagIds: z.array(uuidSchema).optional(),
  publishNow: z.boolean().optional(),
  rules: z
    .object({
      reading: builderRuleSchema.optional(),
      listening: builderRuleSchema.optional(),
      writing: builderRuleSchema.optional(),
      speaking: builderRuleSchema.optional(),
      avoidUsedIds: z.array(z.string().trim().min(1).max(32)).optional(),
    })
    .optional(),
});
