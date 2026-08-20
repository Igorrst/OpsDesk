import { z } from "zod";

const passwordSchema = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

export const registerSchema = z.object({
  organizationName: z.string().trim().min(2).max(120),
  organizationSlug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  adminName: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase().max(254),
  password: passwordSchema,
});

export const loginSchema = z.object({
  organizationSlug: z.string().trim().toLowerCase().min(3).max(80),
  email: z.email().trim().toLowerCase().max(254),
  password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
