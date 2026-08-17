import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "./profile.constant";

export class ProfileValidation {
  static readonly UPDATE_PROFILE = z.object({
    body: z.object({
      name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .optional(),
      phone: z
        .string()
        .trim()
        .min(8, "Phone number is invalid")
        .max(20, "Phone number is invalid")
        .optional(),
    }),
  });

  static readonly UPDATE_EMAIL = z.object({
    body: z.object({
      email: z.string().trim().toLowerCase().email("Invalid email"),
    }),
  });

  static readonly UPDATE_PASSWORD = z.object({
    body: z.object({
      // Optional di level schema karena user yang sebelumnya cuma
      // social-login (belum punya password) tidak wajib isi ini —
      // pengecekan kondisionalnya dilakukan di service (butuh cek state
      // DB, bukan validasi statis input semata).
      currentPassword: z.string().optional(),
      newPassword: z
        .string()
        .min(
          MIN_PASSWORD_LENGTH,
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        ),
    }),
  });
}

export type updateProfileSchema = z.infer<
  typeof ProfileValidation.UPDATE_PROFILE
>;
export type updateEmailSchema = z.infer<typeof ProfileValidation.UPDATE_EMAIL>;
export type updatePasswordSchema = z.infer<
  typeof ProfileValidation.UPDATE_PASSWORD
>;
