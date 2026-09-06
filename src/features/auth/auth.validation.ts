import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "./auth.constant";

const password = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
  );

const email = z.string().trim().toLowerCase().email("Invalid email");

export class AuthValidation {
  static readonly REGISTER = z.object({
    body: z.object({
      name: z.string().trim().min(2, "Name must be at least 2 characters"),
      email,
      // Kode referral MILIK USER LAIN yang mengajak daftar — bukan kode
      // milik user yang sedang register.
      referralCode: z.string().trim().optional(),
    }),
  });

  static readonly VERIFY_EMAIL = z.object({
    body: z.object({
      token: z.string().min(1, "Token is required"),
      password,
    }),
  });

  static readonly RESEND_VERIFICATION = z.object({
    body: z.object({ email }),
  });

  static readonly LOGIN = z.object({
    body: z.object({
      email,
      password: z.string().min(1, "Password is required"),
    }),
  });

  static readonly REQUEST_RESET_PASSWORD = z.object({
    body: z.object({ email }),
  });

  static readonly CONFIRM_RESET_PASSWORD = z.object({
    body: z.object({
      token: z.string().min(1, "Token is required"),
      password,
    }),
  });
}

export type registerSchema = z.infer<typeof AuthValidation.REGISTER>;
export type verifyEmailSchema = z.infer<typeof AuthValidation.VERIFY_EMAIL>;
export type resendVerificationSchema = z.infer<
  typeof AuthValidation.RESEND_VERIFICATION
>;
export type loginSchema = z.infer<typeof AuthValidation.LOGIN>;
export type requestResetPasswordSchema = z.infer<
  typeof AuthValidation.REQUEST_RESET_PASSWORD
>;
export type confirmResetPasswordSchema = z.infer<
  typeof AuthValidation.CONFIRM_RESET_PASSWORD
>;
