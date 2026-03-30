export type UploadFolder =
  | "speaking-audio"
  | "imports"
  | "images"
  | "avatars"
  | "blogs";

export type PresignUploadBody = {
  folder: UploadFolder;
  filename: string;
  contentType: string;
};

export type CompleteUploadBody = {
  fileKey?: string;
  fileUrl?: string;
};

export type DeleteUploadBody = {
  fileKey?: string;
  fileUrl?: string;
};
