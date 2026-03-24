import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email();
const passwordSchema = z.string().min(8).max(72);

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(255),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Confirm password does not match",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const verifyResetCodeSchema = z.object({
  email: emailSchema,
  code: z.string().trim().length(6),
});

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    code: z.string().trim().length(6),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Confirm password does not match",
  });
