import { uploaded_file_purpose, uploaded_file_status } from "@prisma/client";
import { z } from "zod";

const folderSchema = z.enum([
  "speaking-audio",
  "listening-audio",
  "imports",
  "images",
  "reading-images",
  "writing-images",
  "avatars",
  "blogs",
]);

const purposeSchema = z.nativeEnum(uploaded_file_purpose);
const statusSchema = z.nativeEnum(uploaded_file_status);

export const cloudinaryUploadSchema = z.object({
  folder: folderSchema,
  purpose: purposeSchema.optional(),
});

export const presignUploadSchema = z.object({
  folder: folderSchema,
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(150),
  purpose: purposeSchema.optional(),
});

const uploadTargetBaseSchema = z.object({
  fileKey: z.string().trim().min(1).optional(),
  fileUrl: z.string().trim().url().optional(),
});

export const completeUploadSchema = uploadTargetBaseSchema
  .extend({
    purpose: purposeSchema.optional(),
  })
  .refine((data) => !!data.fileKey || !!data.fileUrl, {
    message: "Either fileKey or fileUrl is required",
    path: ["fileKey"],
  });

export const deleteUploadSchema = uploadTargetBaseSchema.refine(
  (data) => !!data.fileKey || !!data.fileUrl,
  {
    message: "Either fileKey or fileUrl is required",
    path: ["fileKey"],
  },
);

export const uploadListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  purpose: purposeSchema.optional(),
  status: statusSchema.optional(),
  kind: z.enum(["image", "audio", "document", "other"]).optional(),
  folder: folderSchema.optional(),
  search: z.string().trim().max(120).optional(),
});

export const uploadIdParamsSchema = z.object({
  id: z.string().uuid(),
});
