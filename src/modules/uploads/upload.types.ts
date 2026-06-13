import { uploaded_file_purpose, uploaded_file_status } from "@prisma/client";

export type UploadFolder =
  | "speaking-audio"
  | "listening-audio"
  | "imports"
  | "images"
  | "reading-images"
  | "writing-images"
  | "avatars"
  | "blogs";

export type PresignUploadBody = {
  folder: UploadFolder;
  filename: string;
  contentType: string;
  purpose?: uploaded_file_purpose;
};

export type CompleteUploadBody = {
  fileKey?: string;
  fileUrl?: string;
  purpose?: uploaded_file_purpose;
};

export type DeleteUploadBody = {
  fileKey?: string;
  fileUrl?: string;
};

export type UploadListQuery = {
  page?: number;
  limit?: number;
  purpose?: uploaded_file_purpose;
  status?: uploaded_file_status;
  kind?: "image" | "audio" | "document" | "other";
  folder?: UploadFolder;
  search?: string;
};
