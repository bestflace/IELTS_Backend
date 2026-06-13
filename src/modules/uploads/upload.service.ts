import path from "path";
import crypto from "crypto";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v2 as cloudinary } from "cloudinary";
import { Prisma } from "@prisma/client";

import { MESSAGE } from "../../common/constants/message.constant";
import { prisma } from "../../config/prisma";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { ForbiddenError } from "../../common/errors/forbidden.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import {
  buildR2FileUrl,
  getR2Bucket,
  getR2Client,
  getR2Config,
} from "./upload_r2_shim";
import {
  CompleteUploadBody,
  DeleteUploadBody,
  PresignUploadBody,
  UploadFolder,
  UploadListQuery,
} from "./upload.types";

type UserRole = "USER" | "TEACHER" | "ADMIN";

type FolderPolicy = {
  roles: UserRole[];
  allowedContentTypes: string[];
  maxSizeMb: number;
};

type CloudinaryResourceType = "image" | "video" | "raw";

const AUDIO_CONTENT_TYPES = [
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
];

const IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const EXCEL_CONTENT_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
];

const FOLDER_POLICIES: Record<UploadFolder, FolderPolicy> = {
  "speaking-audio": {
    roles: ["USER", "TEACHER", "ADMIN"],
    allowedContentTypes: AUDIO_CONTENT_TYPES,
    maxSizeMb: 25,
  },

  "listening-audio": {
    roles: ["TEACHER", "ADMIN"],
    allowedContentTypes: AUDIO_CONTENT_TYPES,
    maxSizeMb: 50,
  },

  imports: {
    roles: ["ADMIN"],
    allowedContentTypes: EXCEL_CONTENT_TYPES,
    maxSizeMb: 15,
  },

  images: {
    roles: ["USER", "TEACHER", "ADMIN"],
    allowedContentTypes: IMAGE_CONTENT_TYPES,
    maxSizeMb: 10,
  },

  "reading-images": {
    roles: ["TEACHER", "ADMIN"],
    allowedContentTypes: IMAGE_CONTENT_TYPES,
    maxSizeMb: 10,
  },

  "writing-images": {
    roles: ["TEACHER", "ADMIN"],
    allowedContentTypes: IMAGE_CONTENT_TYPES,
    maxSizeMb: 10,
  },

  avatars: {
    roles: ["USER", "TEACHER", "ADMIN"],
    allowedContentTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxSizeMb: 5,
  },

  blogs: {
    roles: ["ADMIN"],
    allowedContentTypes: IMAGE_CONTENT_TYPES,
    maxSizeMb: 10,
  },
};

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

function assertCloudinaryConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new BadRequestError("Cloudinary storage is not configured");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!.trim(),
    api_key: process.env.CLOUDINARY_API_KEY!.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET!.trim(),
    secure: true,
  });
}

function getCloudinaryRootFolder() {
  return (
    process.env.CLOUDINARY_ROOT_FOLDER?.trim().replace(/^\/+|\/+$/g, "") ||
    "ieltsbf"
  );
}

function buildCloudinaryFolder(folder: UploadFolder, userId: string) {
  return `${getCloudinaryRootFolder()}/${folder}/${userId}`;
}

function toAppFileKey(cloudinaryPublicId: string) {
  const normalizedPublicId = cloudinaryPublicId.replace(/^\/+/, "");
  const root = getCloudinaryRootFolder();
  const prefix = `${root}/`;

  if (normalizedPublicId.startsWith(prefix)) {
    return normalizedPublicId.slice(prefix.length);
  }

  return normalizedPublicId;
}

function toCloudinaryPublicId(fileKey: string) {
  const normalizedFileKey = fileKey.replace(/^\/+/, "");
  const root = getCloudinaryRootFolder();
  const prefix = `${root}/`;

  if (normalizedFileKey.startsWith(prefix)) {
    return normalizedFileKey;
  }

  return `${prefix}${normalizedFileKey}`;
}

function getCloudinaryResourceType(
  contentType: string,
): CloudinaryResourceType {
  const type = contentType.toLowerCase();

  if (type.startsWith("image/")) return "image";
  if (type.startsWith("audio/")) return "video";
  if (type.startsWith("video/")) return "video";

  return "raw";
}

function bufferToDataUri(buffer: Buffer, contentType: string) {
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

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

  try {
    const config = getR2Config();

    if (config.publicUrl && fileUrl.startsWith(config.publicUrl)) {
      return pathname;
    }

    if (pathname.startsWith(`${config.bucket}/`)) {
      return pathname.slice(config.bucket.length + 1);
    }
  } catch {
    // Không phải R2 URL hoặc R2 chưa cấu hình.
  }

  return pathname;
}

function parseOwnershipFromFileKey(fileKey: string) {
  const appFileKey = toAppFileKey(fileKey);
  const parts = appFileKey.split("/").filter(Boolean);

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
  const appFileKey = toAppFileKey(fileKey);
  const { folder, ownerUserId } = parseOwnershipFromFileKey(appFileKey);

  assertFolderPermission(folder, role);

  if (role !== "ADMIN" && ownerUserId !== userId) {
    throw new ForbiddenError(MESSAGE.UPLOAD.CANNOT_ACCESS_FOREIGN_FILE);
  }

  return folder;
}

function isProbablyCloudinaryUrl(fileUrl?: string) {
  if (!fileUrl) return false;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();

  return (
    fileUrl.includes("res.cloudinary.com") ||
    Boolean(cloudName && fileUrl.includes(cloudName))
  );
}

function getCloudinaryPublicIdFromBody(body: DeleteUploadBody) {
  const fileKey = extractFileKey(body);

  if (body.fileUrl && isProbablyCloudinaryUrl(body.fileUrl)) {
    const root = getCloudinaryRootFolder();
    const decodedPath = decodeURIComponent(new URL(body.fileUrl).pathname);

    const uploadMarker = "/upload/";
    const uploadIndex = decodedPath.indexOf(uploadMarker);

    if (uploadIndex >= 0) {
      const afterUpload = decodedPath.slice(uploadIndex + uploadMarker.length);
      const withoutVersion = afterUpload.replace(/^v\d+\//, "");
      const withoutLeadingSlash = withoutVersion.replace(/^\/+/, "");
      const withoutExtension = withoutLeadingSlash.replace(
        /\.[a-zA-Z0-9]+$/,
        "",
      );

      if (withoutExtension.startsWith(`${root}/`)) {
        return withoutExtension;
      }

      if (withoutExtension.includes(`${root}/`)) {
        return withoutExtension.slice(withoutExtension.indexOf(`${root}/`));
      }
    }
  }

  return toCloudinaryPublicId(fileKey);
}

function getUploadKind(contentType?: string | null) {
  const normalized = (contentType || "").toLowerCase();

  if (normalized.startsWith("image/")) return "image";
  if (normalized.startsWith("audio/") || normalized.startsWith("video/")) {
    return "audio";
  }

  if (
    normalized.includes("spreadsheet") ||
    normalized.includes("excel") ||
    normalized.includes("csv") ||
    normalized === "text/csv"
  ) {
    return "document";
  }

  return "other";
}

function getFolderFromStoredFileKey(fileKey: string): UploadFolder | null {
  const appFileKey = toAppFileKey(fileKey);
  const folder = appFileKey.split("/").filter(Boolean)[0] as UploadFolder;

  return FOLDER_POLICIES[folder] ? folder : null;
}

function toNumber(value?: bigint | number | null) {
  if (typeof value === "bigint") return Number(value);
  return value ?? null;
}

function mapUploadedFile(row: any) {
  const fileKey = toAppFileKey(row.file_key);
  const metadata =
    row.metadata_json && typeof row.metadata_json === "object"
      ? row.metadata_json
      : {};

  const folder = getFolderFromStoredFileKey(fileKey);
  const kind = getUploadKind(row.content_type);

  return {
    id: row.id,
    uploadedBy: row.uploaded_by,
    uploaded_by: row.uploaded_by,
    purpose: row.purpose,
    status: row.status,
    bucket: row.bucket,
    fileKey,
    file_key: fileKey,
    fileUrl: row.file_url,
    file_url: row.file_url,
    url: row.file_url,
    originalName: row.original_name,
    original_name: row.original_name,
    contentType: row.content_type,
    content_type: row.content_type,
    sizeBytes: toNumber(row.size_bytes),
    size_bytes: toNumber(row.size_bytes),
    eTag: row.etag,
    etag: row.etag,
    checksumSha256: row.checksum_sha256,
    checksum_sha256: row.checksum_sha256,
    metadataJson: metadata,
    metadata_json: metadata,
    provider: metadata.provider ?? null,
    resourceType: metadata.resourceType ?? metadata.resource_type ?? null,
    folder,
    kind,
    completedAt: row.completed_at,
    completed_at: row.completed_at,
    deletedAt: row.deleted_at,
    deleted_at: row.deleted_at,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    uploader: row.users
      ? {
          id: row.users.id,
          fullName: row.users.full_name,
          full_name: row.users.full_name,
          email: row.users.email,
        }
      : null,
  };
}

function buildUploadWhere(query: UploadListQuery) {
  const baseWhere: Prisma.uploaded_filesWhereInput = {};

  if (query.status) {
    baseWhere.status = query.status;
  } else {
    baseWhere.status = {
      not: "DELETED",
    };
  }

  if (query.purpose) {
    baseWhere.purpose = query.purpose;
  }

  if (query.folder) {
    baseWhere.file_key = {
      startsWith: `${query.folder}/`,
      mode: "insensitive",
    };
  }

  const andWhere: Prisma.uploaded_filesWhereInput[] = [baseWhere];

  if (query.kind === "image") {
    andWhere.push({
      content_type: {
        startsWith: "image/",
        mode: "insensitive",
      },
    });
  }

  if (query.kind === "audio") {
    andWhere.push({
      OR: [
        {
          content_type: {
            startsWith: "audio/",
            mode: "insensitive",
          },
        },
        {
          content_type: {
            startsWith: "video/",
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (query.kind === "document") {
    andWhere.push({
      OR: [
        {
          content_type: {
            contains: "spreadsheet",
            mode: "insensitive",
          },
        },
        {
          content_type: {
            contains: "excel",
            mode: "insensitive",
          },
        },
        {
          content_type: {
            contains: "csv",
            mode: "insensitive",
          },
        },
        {
          purpose: "IMPORT_EXCEL",
        },
      ],
    });
  }

  if (query.kind === "other") {
    andWhere.push({
      NOT: [
        {
          content_type: {
            startsWith: "image/",
            mode: "insensitive",
          },
        },
        {
          content_type: {
            startsWith: "audio/",
            mode: "insensitive",
          },
        },
        {
          content_type: {
            startsWith: "video/",
            mode: "insensitive",
          },
        },
        {
          content_type: {
            contains: "spreadsheet",
            mode: "insensitive",
          },
        },
        {
          content_type: {
            contains: "excel",
            mode: "insensitive",
          },
        },
        {
          content_type: {
            contains: "csv",
            mode: "insensitive",
          },
        },
      ],
    });
  }

  const search = query.search?.trim();

  if (search) {
    andWhere.push({
      OR: [
        {
          original_name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          file_key: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          file_url: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          content_type: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  return andWhere.length === 1
    ? baseWhere
    : ({
        AND: andWhere,
      } satisfies Prisma.uploaded_filesWhereInput);
}

async function upsertUploadedFileRecord(data: {
  uploadedBy: string;
  purpose?: any;
  bucket?: string | null;
  fileKey: string;
  fileUrl: string;
  originalName?: string | null;
  contentType?: string | null;
  sizeBytes?: number | bigint | null;
  eTag?: string | null;
  metadataJson?: Prisma.InputJsonValue;
}) {
  const fileKey = toAppFileKey(data.fileKey);

  return prisma.uploaded_files.upsert({
    where: {
      file_key: fileKey,
    },
    create: {
      uploaded_by: data.uploadedBy,
      purpose: data.purpose ?? "OTHER",
      status: "COMPLETED",
      bucket: data.bucket ?? null,
      file_key: fileKey,
      file_url: data.fileUrl,
      original_name: data.originalName ?? null,
      content_type: data.contentType ?? null,
      size_bytes:
        data.sizeBytes === null || data.sizeBytes === undefined
          ? null
          : BigInt(data.sizeBytes),
      etag: data.eTag ?? null,
      metadata_json: data.metadataJson ?? {},
      completed_at: new Date(),
    },
    update: {
      uploaded_by: data.uploadedBy,
      purpose: data.purpose ?? "OTHER",
      status: "COMPLETED",
      bucket: data.bucket ?? null,
      file_url: data.fileUrl,
      original_name: data.originalName ?? null,
      content_type: data.contentType ?? null,
      size_bytes:
        data.sizeBytes === null || data.sizeBytes === undefined
          ? null
          : BigInt(data.sizeBytes),
      etag: data.eTag ?? null,
      metadata_json: data.metadataJson ?? {},
      completed_at: new Date(),
      deleted_at: null,
      updated_at: new Date(),
    },
  });
}

export const uploadService = {
  async getUploads(query: UploadListQuery) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;
    const where = buildUploadWhere(query);

    const [items, total] = await Promise.all([
      prisma.uploaded_files.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.uploaded_files.count({ where }),
    ]);

    return {
      items: items.map(mapUploadedFile),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  },

  async getUploadById(id: string, userId: string, role: string) {
    const item = await prisma.uploaded_files.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!item || item.status === "DELETED") {
      throw new NotFoundError(MESSAGE.UPLOAD.FILE_NOT_FOUND);
    }

    if (role !== "ADMIN" && item.uploaded_by !== userId) {
      throw new ForbiddenError(MESSAGE.UPLOAD.CANNOT_ACCESS_FOREIGN_FILE);
    }

    return mapUploadedFile(item);
  },

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

      const fileUrl = buildR2FileUrl(fileKey);

      await upsertUploadedFileRecord({
        uploadedBy: userId,
        purpose: body.purpose,
        bucket,
        fileKey,
        fileUrl,
        originalName: path.basename(fileKey),
        contentType: result.ContentType ?? null,
        sizeBytes: result.ContentLength ?? null,
        eTag: result.ETag ?? null,
        metadataJson: {
          provider: "r2",
          folder,
          lastModified: result.LastModified?.toISOString?.() ?? null,
        },
      });

      return {
        fileKey,
        fileUrl,
        folder,
        contentType: result.ContentType ?? null,
        size: result.ContentLength ?? null,
        sizeBytes: result.ContentLength ?? null,
        eTag: result.ETag ?? null,
        lastModified: result.LastModified ?? null,
        exists: true,
        purpose: body.purpose ?? "OTHER",
        status: "COMPLETED",
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

  async uploadToCloudinary(
    userId: string,
    role: string,
    body: {
      folder: UploadFolder;
      purpose?: any;
    },
    file?: Express.Multer.File,
  ) {
    assertCloudinaryConfigured();

    if (!file) {
      throw new BadRequestError("File is required");
    }

    assertFolderPermission(body.folder, role);
    assertContentTypeAllowed(body.folder, file.mimetype);

    const policy = FOLDER_POLICIES[body.folder];
    const maxBytes = policy.maxSizeMb * 1024 * 1024;

    if (file.size <= 0) {
      throw new BadRequestError(MESSAGE.UPLOAD.EMPTY_UPLOADED_FILE);
    }

    if (file.size > maxBytes) {
      throw new BadRequestError(
        `File is too large. Maximum size is ${policy.maxSizeMb}MB`,
      );
    }

    const safeFilename = sanitizeFilename(file.originalname || "file");
    const ext = path.extname(safeFilename);
    const basename = path.basename(safeFilename, ext);
    const randomId = crypto.randomBytes(6).toString("hex");

    const cloudinaryFolder = buildCloudinaryFolder(body.folder, userId);
    const publicId = `${Date.now()}-${randomId}-${basename}`;
    const resourceType = getCloudinaryResourceType(file.mimetype);
    const dataUri = bufferToDataUri(file.buffer, file.mimetype);

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: cloudinaryFolder,
      public_id: publicId,
      resource_type: resourceType,
      overwrite: false,
    });

    const cloudinaryPublicId = result.public_id;
    const fileKey = toAppFileKey(cloudinaryPublicId);
    const fileUrl = result.secure_url;

    await upsertUploadedFileRecord({
      uploadedBy: userId,
      purpose: body.purpose,
      bucket: "cloudinary",
      fileKey,
      fileUrl,
      originalName: file.originalname,
      contentType: file.mimetype,
      sizeBytes: file.size,
      metadataJson: {
        provider: "cloudinary",
        folder: body.folder,
        resourceType,
        cloudinaryPublicId,
        assetId: result.asset_id,
        version: result.version,
        format: result.format,
        bytes: result.bytes,
      },
    });

    return {
      folder: body.folder,
      fileKey,
      fileUrl,
      contentType: file.mimetype,
      size: file.size,
      sizeBytes: file.size,
      provider: "cloudinary",
      resourceType,
      originalName: file.originalname,
      originalFilename: file.originalname,
      cloudinaryPublicId,
      assetId: result.asset_id,
      version: result.version,
      format: result.format,
      bytes: result.bytes,
      purpose: body.purpose ?? "OTHER",
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
    };
  },

  async deleteUpload(userId: string, role: string, body: DeleteUploadBody) {
    const fileKey = extractFileKey(body);
    const appFileKey = toAppFileKey(fileKey);

    assertCanAccessFile(appFileKey, userId, role);

    if (isProbablyCloudinaryUrl(body.fileUrl) || isCloudinaryConfigured()) {
      assertCloudinaryConfigured();

      const cloudinaryPublicId = getCloudinaryPublicIdFromBody({
        ...body,
        fileKey: appFileKey,
      });

      const resourceType =
        appFileKey.startsWith("speaking-audio/") ||
        appFileKey.startsWith("listening-audio/")
          ? "video"
          : appFileKey.startsWith("imports/")
            ? "raw"
            : "image";

      try {
        await cloudinary.uploader.destroy(cloudinaryPublicId, {
          resource_type: resourceType as CloudinaryResourceType,
          invalidate: true,
        });

        await prisma.uploaded_files.updateMany({
          where: {
            OR: [{ file_key: appFileKey }, { file_url: body.fileUrl }],
          },
          data: {
            status: "DELETED",
            deleted_at: new Date(),
            updated_at: new Date(),
          },
        });

        return {
          success: true,
          fileKey: appFileKey,
          provider: "cloudinary",
        };
      } catch {
        throw new BadRequestError(MESSAGE.UPLOAD.FILE_NOT_FOUND);
      }
    }

    assertR2Configured();

    const client = getR2Client();
    const bucket = getR2Bucket();

    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: appFileKey,
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
        Key: appFileKey,
      }),
    );

    await prisma.uploaded_files.updateMany({
      where: {
        OR: [{ file_key: appFileKey }, { file_url: body.fileUrl }],
      },
      data: {
        status: "DELETED",
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      fileKey: appFileKey,
      provider: "r2",
    };
  },
};
