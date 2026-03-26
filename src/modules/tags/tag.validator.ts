import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const listTagsQuerySchema = z.object({
  search: z.string().trim().optional(),
});

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(
      slugRegex,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    )
    .optional(),
});

export const updateTagParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateTagSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(
        slugRegex,
        "Slug must contain only lowercase letters, numbers, and hyphens",
      )
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.slug !== undefined, {
    message: "At least one field is required",
    path: ["name"],
  });

export const deleteTagParamsSchema = z.object({
  id: z.string().uuid(),
});
