import { TokenType } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { BcryptUtil } from "../../utils/bcrypt-util";
import { MailerUtil } from "../../utils/mailer";
import { issueAuthToken } from "../../utils/token";
import { BadRequestError } from "../../errors/BadRequestError";
import { ConflictError } from "../../errors/ConflictError";
import { NotFoundError } from "../../errors/NotFoundError";
import { UnAuthorizedError } from "../../errors/UnauthorizedError";
import { AVATAR_UPLOAD_FOLDER } from "./profile.constant";
import type {
  updateProfileSchema,
  updateEmailSchema,
  updatePasswordSchema,
} from "./profile.validation";

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

export class ProfileService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: SAFE_USER_SELECT,
    });
    if (!user) throw new NotFoundError("User not found");
    return user;
  }

  static async updateProfile(userId: string, { body }: updateProfileSchema) {
    return prisma.user.update({
      where: { id: userId },
      data: body,
      select: SAFE_USER_SELECT,
    });
  }

  static async updateAvatar(userId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestError("Avatar file is required");
    }

    const avatarUrl = await uploadToCloudinary(
      file.buffer,
      AVATAR_UPLOAD_FOLDER,
    );

    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: SAFE_USER_SELECT,
    });
  }

  /**
   * Sesuai requirement: update email wajib verifikasi ulang. Email
   * langsung diganti + isVerified di-reset, lalu email verifikasi baru
   * dikirim ke alamat BARU.
   *
   * Trade-off yang perlu diketahui: kalau user salah ketik email baru,
   * dia bisa kehilangan akses — belum ada mekanisme "pending email"
   * terpisah dari email aktif (butuh kolom tambahan di schema kalau mau
   * dibuat lebih aman, di luar scope perbaikan saat ini).
   */
  static async updateEmail(userId: string, { body }: updateEmailSchema) {
    const { email } = body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== userId) {
      throw new ConflictError("Email is already in use by another account");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { email, isVerified: false, verifiedAt: null },
      select: SAFE_USER_SELECT,
    });

    const token = await issueAuthToken(userId, TokenType.EMAIL_VERIFICATION);
    await MailerUtil.sendVerificationEmail(email, token);

    return user;
  }

  static async updatePassword(userId: string, { body }: updatePasswordSchema) {
    const { currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new NotFoundError("User not found");

    // User yang sebelumnya cuma social-login (belum punya password) boleh
    // langsung set password baru tanpa currentPassword. User yang sudah
    // punya password WAJIB verifikasi currentPassword dulu.
    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestError("Current password is required");
      }
      const isValid = await BcryptUtil.comparePassword(
        currentPassword,
        user.passwordHash,
      );
      if (!isValid) {
        throw new UnAuthorizedError("Current password is incorrect");
      }
    }

    const passwordHash = await BcryptUtil.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: "Password updated successfully" };
  }
}
