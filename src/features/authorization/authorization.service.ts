import { prisma } from "../../configs/prisma-client-config";
import { UnAuthorizedError } from "../../errors/UnauthorizedError";

const SESSION_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isVerified: true,
  storeId: true,
} as const;

export class AuthorizationService {
  /**
   * Sumber kebenaran status auth yang FRESH dari database — dipanggil
   * frontend saat app pertama kali load / setelah aksi yang bisa mengubah
   * role atau isVerified (mis. baru saja verifikasi email di tab lain).
   * JWT payload sengaja tidak dipakai sebagai sumber ini karena bisa basi
   * sebelum token-nya sendiri expired.
   */
  static async getSession(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: SESSION_SELECT,
    });

    if (!user) {
      throw new UnAuthorizedError("Account not found");
    }

    return user;
  }
}
