import { z } from "zod";

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginUserSchema>;

export const registerUserSchema = loginUserSchema.extend({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(["admin", "editor", "analyst", "viewer"]).default("viewer"),
});

export type RegisterInput = z.infer<typeof registerUserSchema>;

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    role: z.enum(["admin", "editor", "analyst", "viewer"]).optional(),
  })
  .strict();

export type UpdateInput = z.infer<typeof updateUserSchema>;

// Self-service: a user may only change their own display name.
// (Deliberately separate from updateUserSchema, which can change `role` and is for admins.)
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  })
  .strict();

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
