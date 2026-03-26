import { z } from "zod";

const pageNumberSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().optional());

const limitNumberSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().max(100).optional());

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(255).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

export const adminListUsersQuerySchema = z.object({
  page: pageNumberSchema,
  limit: limitNumberSchema,
  search: z.string().trim().optional(),
  role: z.enum(["USER", "TEACHER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "BLOCKED", "PENDING"]).optional(),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const adminUpdateUserSchema = z
  .object({
    fullName: z.string().trim().min(2).max(255).optional(),
    role: z.enum(["USER", "TEACHER", "ADMIN"]).optional(),
    status: z.enum(["ACTIVE", "BLOCKED", "PENDING"]).optional(),
  })
  .refine(
    (data) =>
      data.fullName !== undefined ||
      data.role !== undefined ||
      data.status !== undefined,
    {
      message: "At least one field is required",
      path: ["fullName"],
    },
  );

export const adminUpdateUserRoleSchema = z.object({
  role: z.enum(["USER", "TEACHER", "ADMIN"]),
});

export const adminUpdateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED", "PENDING"]),
});
