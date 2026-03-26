import { z } from "zod";

const writingTaskIdSchema = z.string().trim().min(1).max(32);
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

const taskNoSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().optional());

const taskNoNullableSchema = z.preprocess((value) => {
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

const bandScoreSchema = z.number().min(0).max(9);
const bandScoreNullableSchema = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return Number(value);
}, z.number().min(0).max(9).nullable().optional());

export const publicWritingTaskListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().optional(),
  level: levelSchema,
  tagIds: tagIdsQuerySchema,
  taskNo: taskNoSchema,
});

export const adminWritingTaskListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().optional(),
  level: levelSchema,
  tagIds: tagIdsQuerySchema,
  taskNo: taskNoSchema,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const writingTaskIdParamsSchema = z.object({
  id: writingTaskIdSchema,
});

export const createWritingTaskSchema = z.object({
  id: writingTaskIdSchema,
  taskNo: taskNoNullableSchema,
  title: z.string().trim().min(1).max(255),
  promptText: z.string().trim().min(1),
  chartUrl: z.string().trim().url().nullable().optional(),
  imageUrl: z.string().trim().url().nullable().optional(),
  level: bandScoreNullableSchema,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  tagIds: z.array(uuidSchema).optional(),
});

export const updateWritingTaskSchema = z
  .object({
    taskNo: taskNoNullableSchema,
    title: z.string().trim().min(1).max(255).optional(),
    promptText: z.string().trim().min(1).optional(),
    chartUrl: z.string().trim().url().nullable().optional(),
    imageUrl: z.string().trim().url().nullable().optional(),
    level: bandScoreNullableSchema,
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    tagIds: z.array(uuidSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
    path: ["title"],
  });
