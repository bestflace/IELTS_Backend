import { z } from "zod";

const folderSchema = z.enum([
  "speaking-audio",
  "imports",
  "images",
  "avatars",
  "blogs",
]);

export const presignUploadSchema = z.object({
  folder: folderSchema,
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(150),
});

export const completeUploadSchema = z
  .object({
    fileKey: z.string().trim().min(1).optional(),
    fileUrl: z.string().trim().url().optional(),
  })
  .refine((data) => !!data.fileKey || !!data.fileUrl, {
    message: "Either fileKey or fileUrl is required",
    path: ["fileKey"],
  });

export const deleteUploadSchema = completeUploadSchema;
