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

export const publicBlogListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().optional(),
  tagIds: tagIdsQuerySchema,
});

export const adminBlogListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().optional(),
  tagIds: tagIdsQuerySchema,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const blogIdParamsSchema = z.object({
  id: uuidSchema,
});

export const blogSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(255),
});

export const createBlogSchema = z.object({
  title: z.string().trim().min(1).max(255),
  excerpt: z.string().trim().min(1).nullable().optional(),
  contentMarkdown: z.string().trim().min(1),
  coverImageUrl: z.string().trim().url().nullable().optional(),
  tagIds: z.array(uuidSchema).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const updateBlogSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    excerpt: z.string().trim().min(1).nullable().optional(),
    contentMarkdown: z.string().trim().min(1).optional(),
    coverImageUrl: z.string().trim().url().nullable().optional(),
    tagIds: z.array(uuidSchema).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
    path: ["title"],
  });
