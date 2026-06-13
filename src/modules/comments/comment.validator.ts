import { comment_status } from "@prisma/client";
import { z } from "zod";

const attemptIdSchema = z.string().trim().min(1).max(32);
const commentIdSchema = z.string().uuid();

export const attemptIdParamsSchema = z.object({
  id: attemptIdSchema,
});

export const commentIdParamsSchema = z.object({
  commentId: commentIdSchema,
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1),
  parentId: z.string().uuid().nullable().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1),
});

export const adminCommentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(comment_status).optional(),
  search: z.string().trim().optional(),
});
