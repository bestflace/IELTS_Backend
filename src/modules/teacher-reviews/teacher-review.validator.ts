import { z } from "zod";

const uuidSchema = z.string().uuid();

const pageSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().optional());

const limitSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().max(100).optional());

const booleanSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}, z.boolean().optional());

const bandSchema = z.number().min(0).max(9);

export const teacherSubmissionIdParamsSchema = z.object({
  id: uuidSchema,
});

export const teacherSubmissionListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  skill: z.enum(["WRITING", "SPEAKING"]).optional(),
  status: z.enum(["PENDING", "CLAIMED", "REVIEWED"]).optional(),
  mine: booleanSchema,
});

export const writingReviewSchema = z.object({
  overallBand: bandSchema,
  taskAchievement: bandSchema,
  coherenceCohesion: bandSchema,
  lexicalResource: bandSchema,
  grammaticalRangeAccuracy: bandSchema,
  summary: z.string().trim().min(1),
  actionItems: z.array(z.string().trim().min(1)).optional(),
});

export const speakingReviewSchema = z.object({
  overallBand: bandSchema,
  fluencyCoherence: bandSchema,
  lexicalResource: bandSchema,
  grammaticalRangeAccuracy: bandSchema,
  pronunciation: bandSchema,
  summary: z.string().trim().min(1),
  actionItems: z.array(z.string().trim().min(1)).optional(),
});
