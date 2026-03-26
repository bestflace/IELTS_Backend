import { z } from "zod";

const listeningSetIdSchema = z.string().trim().min(1).max(32);
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

const jsonValueSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

const bandScoreSchema = z.number().min(0).max(9);
const positiveIntSchema = z.number().int().positive();
const positiveNumberSchema = z.number().positive();

export const publicListeningSetListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().optional(),
  level: levelSchema,
  tagIds: tagIdsQuerySchema,
});

export const adminListeningSetListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().optional(),
  level: levelSchema,
  tagIds: tagIdsQuerySchema,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const listeningSetIdParamsSchema = z.object({
  id: listeningSetIdSchema,
});

export const createListeningSetSchema = z.object({
  id: listeningSetIdSchema,
  title: z.string().trim().min(1).max(255),
  transcriptText: z.string().trim().min(1).nullable().optional(),
  audioUrl: z.string().trim().url().nullable().optional(),
  audioSource: z.enum(["UPLOAD", "URL", "R2"]).nullable().optional(),
  level: bandScoreSchema,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  tagIds: z.array(uuidSchema).optional(),
});

export const updateListeningSetSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    transcriptText: z.string().trim().min(1).nullable().optional(),
    audioUrl: z.string().trim().url().nullable().optional(),
    audioSource: z.enum(["UPLOAD", "URL", "R2"]).nullable().optional(),
    level: bandScoreSchema.nullable().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    tagIds: z.array(uuidSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
    path: ["title"],
  });

export const listeningQuestionIdParamsSchema = z.object({
  questionId: uuidSchema,
});

export const createListeningQuestionSchema = z.object({
  qNo: positiveIntSchema,
  sectionLabel: z.string().trim().min(1).max(50).nullable().optional(),
  questionType: z.enum([
    "MULTIPLE_CHOICE",
    "TRUE_FALSE_NOT_GIVEN",
    "YES_NO_NOT_GIVEN",
    "MATCHING_HEADINGS",
    "MATCHING_INFORMATION",
    "MATCHING_FEATURES",
    "MATCHING_SENTENCE_ENDINGS",
    "SENTENCE_COMPLETION",
    "SUMMARY_COMPLETION",
    "NOTE_COMPLETION",
    "TABLE_COMPLETION",
    "FLOWCHART_COMPLETION",
    "DIAGRAM_LABEL_COMPLETION",
    "SHORT_ANSWER",
    "FORM_COMPLETION",
    "MAP_LABELING",
  ]),
  promptText: z.string().trim().min(1),
  instructionText: z.string().trim().min(1).nullable().optional(),
  optionsJson: jsonValueSchema.optional(),
  correctAnswerJson: jsonValueSchema,
  explanation: z.string().trim().min(1).nullable().optional(),
  points: positiveNumberSchema.optional(),
  sortOrder: positiveIntSchema,
});

export const updateListeningQuestionSchema = z
  .object({
    qNo: positiveIntSchema.optional(),
    sectionLabel: z.string().trim().min(1).max(50).nullable().optional(),
    questionType: z
      .enum([
        "MULTIPLE_CHOICE",
        "TRUE_FALSE_NOT_GIVEN",
        "YES_NO_NOT_GIVEN",
        "MATCHING_HEADINGS",
        "MATCHING_INFORMATION",
        "MATCHING_FEATURES",
        "MATCHING_SENTENCE_ENDINGS",
        "SENTENCE_COMPLETION",
        "SUMMARY_COMPLETION",
        "NOTE_COMPLETION",
        "TABLE_COMPLETION",
        "FLOWCHART_COMPLETION",
        "DIAGRAM_LABEL_COMPLETION",
        "SHORT_ANSWER",
        "FORM_COMPLETION",
        "MAP_LABELING",
      ])
      .optional(),
    promptText: z.string().trim().min(1).optional(),
    instructionText: z.string().trim().min(1).nullable().optional(),
    optionsJson: jsonValueSchema.optional(),
    correctAnswerJson: jsonValueSchema.optional(),
    explanation: z.string().trim().min(1).nullable().optional(),
    points: positiveNumberSchema.optional(),
    sortOrder: positiveIntSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
    path: ["qNo"],
  });
