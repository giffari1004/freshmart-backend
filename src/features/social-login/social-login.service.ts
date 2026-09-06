import jwt from "jsonwebtoken";
import { AuthProvider } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { JWT_SECRET } from "../../configs/env-config";
import { generateUniqueReferralCode } from "../../utils/referral-code";
import { ConflictError } from "../../errors/ConflictError";
import { JWT_EXPIRES_IN } from "../auth/auth.constant";
import {
  getGoogleAuthUrl,
  getGoogleProfile,
} from "../../integrations/google-oauth-client";
import {
  getFacebookAuthUrl,
  getFacebookProfile,
} from "../../integrations/facebook-oauth-client";
import type { OAuthProfile } from "../../integrations/oauth-types";
import type { oauthCallbackSchema } from "./social-login.validation";

export class SocialLoginService {
  static getGoogleRedirectUrl() {
    return getGoogleAuthUrl();
  }

  static getFacebookRedirectUrl() {
    return getFacebookAuthUrl();
  }

  static async handleGoogleCallback({ query }: oauthCallbackSchema) {
    const profile = await getGoogleProfile(query.code);
    return SocialLoginService.findOrCreateUser(profile, AuthProvider.GOOGLE);
  }

  static async handleFacebookCallback({ query }: oauthCallbackSchema) {
    const profile = await getFacebookProfile(query.code);
    return SocialLoginService.findOrCreateUser(profile, AuthProvider.FACEBOOK);
  }

  /**
   * Find-or-create berdasarkan EMAIL (bukan providerId) — supaya kalau
   * user sebelumnya sempat daftar manual pakai email yang sama, akunnya
   * "menyatu" otomatis, bukan bikin akun duplikat.
   *
   * Trade-off yang perlu didiskusikan ke tim: ini mengasumsikan email
   * dari provider social sudah terverifikasi kepemilikannya oleh
   * Google/Facebook. Kalau ada user yang daftar manual (authProvider
   * EMAIL) lalu login pakai Google dengan email yang sama, akunnya ikut
   * ke-upgrade jadi isVerified true lewat jalur ini — perlu disepakati
   * apakah ini perilaku yang diinginkan, atau harus ditolak dengan pesan
   * error ("email ini sudah terdaftar manual, silakan login manual").
   */
  private static async findOrCreateUser(
    profile: OAuthProfile,
    provider: AuthProvider,
  ) {
    let user = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      const referralCode = await generateUniqueReferralCode();
      user = await prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          authProvider: provider,
          providerId: profile.providerId,
          isVerified: true, // email dari provider social sudah diverifikasi mereka
          verifiedAt: new Date(),
          referralCode,
        },
      });
    } else if (user.deletedAt) {
      throw new ConflictError("This account has been deactivated");
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role, storeId: user.storeId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return { user: safeUser, accessToken };
  }
}
