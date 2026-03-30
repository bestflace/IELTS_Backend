import path from "path";
import crypto from "crypto";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  getR2Bucket,
  getR2Client,
  buildR2FileUrl,
  getR2Config,
} from "./upload_r2_shim";
import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { ForbiddenError } from "../../common/errors/forbidden.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import {
  CompleteUploadBody,
  DeleteUploadBody,
  PresignUploadBody,
  UploadFolder,
} from "./upload.types";

/**
 * NOTE:
 * File này dùng shim nhỏ để không phụ thuộc nhiều vào config hiện có.
 * Xem file upload_r2_shim.ts bên dưới.
 */

type UserRole = "USER" | "TEACHER" | "ADMIN";

type FolderPolicy = {
  roles: UserRole[];
  allowedContentTypes: string[];
  maxSizeMb: number;
};

const FOLDER_POLICIES: Record<UploadFolder, FolderPolicy> = {
  "speaking-audio": {
    roles: ["USER", "TEACHER", "ADMIN"],
    allowedContentTypes: [
      "audio/webm",
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/m4a",
      "audio/x-m4a",
      "audio/aac",
      "audio/ogg",
    ],
    maxSizeMb: 25,
  },

  imports: {
    roles: ["ADMIN"],
    allowedContentTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
    ],
    maxSizeMb: 15,
  },

  images: {
    roles: ["USER", "TEACHER", "ADMIN"],
    allowedContentTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ],
    maxSizeMb: 10,
  },

  avatars: {
    roles: ["USER", "TEACHER", "ADMIN"],
    allowedContentTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxSizeMb: 5,
  },

  blogs: {
    roles: ["ADMIN"],
    allowedContentTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ],
    maxSizeMb: 10,
  },
};

function assertR2Configured() {
  try {
    getR2Config();
  } catch {
    throw new BadRequestError(MESSAGE.UPLOAD.R2_NOT_CONFIGURED);
  }
}

function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext);

  const safeBase = base
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  const safeExt = ext.replace(/[^a-z0-9.]/g, "").slice(0, 10);

  return `${safeBase || "file"}${safeExt}`;
}

function assertFolderPermission(folder: UploadFolder, role: string) {
  const policy = FOLDER_POLICIES[folder];

  if (!policy) {
    throw new BadRequestError(MESSAGE.UPLOAD.INVALID_FOLDER);
  }

  if (!policy.roles.includes(role as UserRole)) {
    throw new ForbiddenError(MESSAGE.UPLOAD.FORBIDDEN_FOLDER);
  }
}

function assertContentTypeAllowed(folder: UploadFolder, contentType: string) {
  const policy = FOLDER_POLICIES[folder];

  if (!policy) {
    throw new BadRequestError(MESSAGE.UPLOAD.INVALID_FOLDER);
  }

  if (!policy.allowedContentTypes.includes(contentType.toLowerCase())) {
    throw new BadRequestError(MESSAGE.UPLOAD.INVALID_CONTENT_TYPE);
  }
}

function generateFileKey(
  folder: UploadFolder,
  userId: string,
  filename: string,
): string {
  const safeFilename = sanitizeFilename(filename);
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const randomId = crypto.randomBytes(6).toString("hex");

  return `${folder}/${userId}/${year}/${month}/${Date.now()}-${randomId}-${safeFilename}`;
}

function extractFileKey(input: { fileKey?: string; fileUrl?: string }): string {
  if (input.fileKey?.trim()) {
    return input.fileKey.trim().replace(/^\/+/, "");
  }

  if (!input.fileUrl?.trim()) {
    throw new BadRequestError(MESSAGE.UPLOAD.INVALID_FILE_KEY);
  }

  const fileUrl = input.fileUrl.trim();
  const url = new URL(fileUrl);
  const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, "");

  const config = getR2Config();

  if (config.publicUrl && fileUrl.startsWith(config.publicUrl)) {
    return pathname;
  }

  if (pathname.startsWith(`${config.bucket}/`)) {
    return pathname.slice(config.bucket.length + 1);
  }

  return pathname;
}

function parseOwnershipFromFileKey(fileKey: string) {
  const parts = fileKey.split("/").filter(Boolean);

  if (parts.length < 2) {
    throw new BadRequestError(MESSAGE.UPLOAD.INVALID_FILE_KEY);
  }

  const folder = parts[0] as UploadFolder;
  const ownerUserId = parts[1];

  if (!FOLDER_POLICIES[folder]) {
    throw new BadRequestError(MESSAGE.UPLOAD.INVALID_FOLDER);
  }

  return {
    folder,
    ownerUserId,
  };
}

function assertCanAccessFile(fileKey: string, userId: string, role: string) {
  const { folder, ownerUserId } = parseOwnershipFromFileKey(fileKey);

  assertFolderPermission(folder, role);

  if (role !== "ADMIN" && ownerUserId !== userId) {
    throw new ForbiddenError(MESSAGE.UPLOAD.CANNOT_ACCESS_FOREIGN_FILE);
  }

  return folder;
}

export const uploadService = {
  async createPresignedUpload(
    userId: string,
    role: string,
    body: PresignUploadBody,
  ) {
    assertR2Configured();
    assertFolderPermission(body.folder, role);
    assertContentTypeAllowed(body.folder, body.contentType);

    const fileKey = generateFileKey(body.folder, userId, body.filename);
    const client = getR2Client();
    const bucket = getR2Bucket();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: body.contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: 60 * 5,
    });

    return {
      folder: body.folder,
      fileKey,
      fileUrl: buildR2FileUrl(fileKey),
      uploadUrl,
      method: "PUT",
      headers: {
        "Content-Type": body.contentType,
      },
      expiresInSec: 300,
      suggestedMaxSizeMb: FOLDER_POLICIES[body.folder].maxSizeMb,
    };
  },

  async completeUpload(userId: string, role: string, body: CompleteUploadBody) {
    assertR2Configured();

    const fileKey = extractFileKey(body);
    const folder = assertCanAccessFile(fileKey, userId, role);

    const client = getR2Client();
    const bucket = getR2Bucket();

    try {
      const result = await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: fileKey,
        }),
      );

      const contentType = (result.ContentType ?? "").toLowerCase();

      if (!contentType) {
        throw new BadRequestError(MESSAGE.UPLOAD.INVALID_CONTENT_TYPE);
      }

      assertContentTypeAllowed(folder, contentType);

      if (!result.ContentLength || result.ContentLength <= 0) {
        throw new BadRequestError(MESSAGE.UPLOAD.EMPTY_UPLOADED_FILE);
      }

      return {
        fileKey,
        fileUrl: buildR2FileUrl(fileKey),
        folder,
        contentType: result.ContentType ?? null,
        size: result.ContentLength ?? null,
        eTag: result.ETag ?? null,
        lastModified: result.LastModified ?? null,
        exists: true,
      };
    } catch (error: any) {
      if (
        error?.$metadata?.httpStatusCode === 404 ||
        error?.name === "NotFound"
      ) {
        throw new NotFoundError(MESSAGE.UPLOAD.FILE_NOT_FOUND);
      }

      if (error instanceof BadRequestError || error instanceof ForbiddenError) {
        throw error;
      }

      throw new BadRequestError(MESSAGE.UPLOAD.FILE_NOT_FOUND);
    }
  },

  async deleteUpload(userId: string, role: string, body: DeleteUploadBody) {
    assertR2Configured();

    const fileKey = extractFileKey(body);
    assertCanAccessFile(fileKey, userId, role);

    const client = getR2Client();
    const bucket = getR2Bucket();

    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: fileKey,
        }),
      );
    } catch (error: any) {
      if (
        error?.$metadata?.httpStatusCode === 404 ||
        error?.name === "NotFound"
      ) {
        throw new NotFoundError(MESSAGE.UPLOAD.FILE_NOT_FOUND);
      }

      throw new BadRequestError(MESSAGE.UPLOAD.FILE_NOT_FOUND);
    }

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      }),
    );

    return {
      success: true,
      fileKey,
    };
  },
};
