import { z } from "zod";

const uuidSchema = z.string().uuid();
const attemptIdSchema = z.string().trim().min(1).max(32);
const testIdSchema = z.string().trim().min(1).max(32);

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

export const notificationListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  unreadOnly: booleanSchema,
});

export const notificationIdParamsSchema = z.object({
  id: uuidSchema,
});

export const internalTestPublishedSchema = z.object({
  testId: testIdSchema,
});

export const internalSubmissionReviewedSchema = z.object({
  attemptId: attemptIdSchema,
});
