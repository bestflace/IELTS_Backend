import { z } from "zod";

const attemptIdSchema = z.string().trim().min(1).max(32);
const testIdSchema = z.string().trim().min(1).max(32);
const questionIdSchema = z.string().uuid();
const writingTaskIdSchema = z.string().trim().min(1).max(32);
const promptIdSchema = z.string().uuid();

const pageSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().optional());

const limitSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().max(100).optional());

const positiveIntSchema = z.number().int().positive();
const positiveIntOptionalSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().optional());

const nullablePositiveIntOptionalSchema = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return Number(value);
}, z.number().int().positive().nullable().optional());

const dateStringSchema = z.string().datetime().optional();

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

export const attemptIdParamsSchema = z.object({
  id: attemptIdSchema,
});

export const createAttemptSchema = z.object({
  testId: testIdSchema,
  mode: z.enum(["READING", "LISTENING", "WRITING", "SPEAKING", "FULL"]),
  partLabel: z.string().trim().min(1).max(20).nullable().optional(),
  timeLimitSec: positiveIntOptionalSchema,
});

export const attemptListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  mode: z
    .enum(["READING", "LISTENING", "WRITING", "SPEAKING", "FULL"])
    .optional(),
  status: z
    .enum(["IN_PROGRESS", "SUBMITTED", "GRADING", "GRADED", "ERROR", "EXPIRED"])
    .optional(),
  from: dateStringSchema,
  to: dateStringSchema,
});

export const saveQuestionAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: questionIdSchema,
        qNo: positiveIntOptionalSchema,
        answerJson: jsonValueSchema,
        isFlagged: z.boolean().optional(),
        isFinal: z.boolean().optional(),
      }),
    )
    .min(1),
});

export const questionIdParamsSchema = z.object({
  id: attemptIdSchema,
  questionId: questionIdSchema,
});

export const patchQuestionAnswerSchema = z
  .object({
    qNo: positiveIntOptionalSchema,
    answerJson: jsonValueSchema.optional(),
    isFlagged: z.boolean().optional(),
    isFinal: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
    path: ["answerJson"],
  });

export const saveWritingResponsesSchema = z.object({
  responses: z
    .array(
      z.object({
        writingTaskId: writingTaskIdSchema,
        responseText: z.string(),
      }),
    )
    .min(1),
});

export const saveSpeakingResponsesSchema = z.object({
  responses: z
    .array(
      z.object({
        speakingPart: z.enum(["PART_1", "PART_2", "PART_3"]),
        promptId: promptIdSchema.nullable().optional(),
        audioUrl: z.string().trim().url(),
        durationSec: nullablePositiveIntOptionalSchema,
      }),
    )
    .min(1),
});

export const speakingPartParamsSchema = z.object({
  id: attemptIdSchema,
  speakingPart: z.enum(["PART_1", "PART_2", "PART_3"]),
});

export const patchSpeakingResponseSchema = z
  .object({
    promptId: promptIdSchema.nullable().optional(),
    audioUrl: z.string().trim().url().nullable().optional(),
    durationSec: nullablePositiveIntOptionalSchema,
    transcript: z.string().trim().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
    path: ["audioUrl"],
  });

export const submitAttemptSchema = z.object({
  force: z.boolean().optional(),
});
export const gradingStatusParamsSchema = z.object({
  id: attemptIdSchema,
});
