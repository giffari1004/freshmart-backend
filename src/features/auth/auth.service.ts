import jwt from "jsonwebtoken";
import { TokenType } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { JWT_SECRET } from "../../configs/env-config";
import { BcryptUtil } from "../../utils/bcrypt-util";
import { MailerUtil } from "../../utils/mailer";
import { generateUniqueReferralCode } from "../../utils/referral-code";
import {
  issueAuthToken,
  consumeAuthToken,
  invalidateActiveTokens,
} from "../../utils/token";
import { BadRequestError } from "../../errors/BadRequestError";
import { UnAuthorizedError } from "../../errors/UnauthorizedError";
import { ConflictError } from "../../errors/ConflictError";
import { NotFoundError } from "../../errors/NotFoundError";
import { JWT_EXPIRES_IN } from "./auth.constant";
import type {
  registerSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
  requestResetPasswordSchema,
  confirmResetPasswordSchema,
} from "./auth.validation";

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  role: true,
  authProvider: true,
  isVerified: true,
  referralCode: true,
  storeId: true,
  createdAt: true,
} as const;

export class AuthService {
  static async register({ body }: registerSchema) {
    const { name, email, referralCode } = body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError("Email is already registered");
    }

    let referredById: string | undefined;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      });
      if (!referrer) {
        throw new BadRequestError("Referral code is invalid");
      }
      referredById = referrer.id;
    }

    const newReferralCode = await generateUniqueReferralCode();

    const user = await prisma.user.create({
      data: { name, email, referralCode: newReferralCode, referredById },
      select: SAFE_USER_SELECT,
    });

    const token = await issueAuthToken(user.id, TokenType.EMAIL_VERIFICATION);
    await MailerUtil.sendVerificationEmail(email, token);

    // TODO: kalau referredById terisi, pemberian voucher reward ke
    // referrer itu domain Voucher/UserVoucher (Feature 2/3) — belum
    // di-wire di sini, perlu koordinasi lintas fitur.

    return user;
  }

  static async verifyEmail({ body }: verifyEmailSchema) {
    const { token, password } = body;

    const authToken = await consumeAuthToken(
      token,
      TokenType.EMAIL_VERIFICATION,
    );

    const passwordHash = await BcryptUtil.hashPassword(password);

    const user = await prisma.user.update({
      where: { id: authToken.userId },
      data: { passwordHash, isVerified: true, verifiedAt: new Date() },
      select: SAFE_USER_SELECT,
    });

    return user;
  }

  static async resendVerification({ body }: resendVerificationSchema) {
    const { email } = body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      throw new NotFoundError("User not found");
    }
    if (user.isVerified) {
      throw new BadRequestError("This email is already verified");
    }

    await invalidateActiveTokens(user.id, TokenType.EMAIL_VERIFICATION);

    const token = await issueAuthToken(user.id, TokenType.EMAIL_VERIFICATION);
    await MailerUtil.sendVerificationEmail(email, token);

    return { message: "Verification email has been resent" };
  }

  static async login({ body }: loginSchema) {
    const { email, password } = body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Pesan error sengaja generik ("Invalid email or password"), tidak
    // dibedakan antara "email tidak ditemukan" vs "password salah" —
    // mencegah user enumeration.
    if (!user || user.deletedAt || !user.passwordHash) {
      throw new UnAuthorizedError("Invalid email or password");
    }

    const isPasswordValid = await BcryptUtil.comparePassword(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnAuthorizedError("Invalid email or password");
    }

    // Sengaja TIDAK memblokir login untuk user yang belum verified —
    // requirement cuma membatasi aksi tertentu (mis. checkout), bukan
    // login itu sendiri. isVerified dikirim balik supaya frontend bisa
    // tampilkan banner peringatan.
    const accessToken = jwt.sign(
      { id: user.id, role: user.role, storeId: user.storeId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return { user: safeUser, accessToken };
  }

  static async requestResetPassword({ body }: requestResetPasswordSchema) {
    const { email } = body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Requirement: reset password cuma untuk user yang daftar via email
    // (bukan social login). Kalau user tidak ada / pakai social login,
    // tetap balas sukses secara generik — jangan bocorkan info akun mana
    // yang valid.
    if (user && !user.deletedAt && user.authProvider === "EMAIL") {
      await invalidateActiveTokens(user.id, TokenType.PASSWORD_RESET);

      const token = await issueAuthToken(user.id, TokenType.PASSWORD_RESET);
      await MailerUtil.sendResetPasswordEmail(email, token);
    }

    return {
      message: "If this email is registered, a reset link has been sent",
    };
  }

  static async confirmResetPassword({ body }: confirmResetPasswordSchema) {
    const { token, password } = body;

    const authToken = await consumeAuthToken(token, TokenType.PASSWORD_RESET);

    const passwordHash = await BcryptUtil.hashPassword(password);

    await prisma.user.update({
      where: { id: authToken.userId },
      data: { passwordHash },
    });

    return { message: "Password has been reset successfully" };
  }
}
