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

export const createImportSchema = z.object({
  type: z.enum([
    "READING_SET",
    "LISTENING_SET",
    "WRITING_TASK",
    "SPEAKING_SET",
    "TEST",
  ]),
  fileUrl: z.string().trim().url(),
});

export const importListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  type: z
    .enum([
      "READING_SET",
      "LISTENING_SET",
      "WRITING_TASK",
      "SPEAKING_SET",
      "TEST",
    ])
    .optional(),
  status: z.enum(["PENDING", "PROCESSING", "DONE", "ERROR"]).optional(),
});

export const importIdParamsSchema = z.object({
  id: uuidSchema,
});
