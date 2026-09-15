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
import { createOAuthState, verifyOAuthState } from "../../integrations/oauth-state";
import { ReferralService } from "../referral/referral.service";

export class SocialLoginService {
  static getGoogleRedirectUrl(referralCode?: string) {
    const state = createOAuthState(referralCode);
    return getGoogleAuthUrl(state);
  }

  static getFacebookRedirectUrl(referralCode?: string) {
    const state = createOAuthState(referralCode);
    return getFacebookAuthUrl(state);
  }

  static async handleGoogleCallback({ query }: oauthCallbackSchema) {
    const state = verifyOAuthState(query.state);
    const profile = await getGoogleProfile(query.code);

    return SocialLoginService.findOrCreateUser(
      profile,
      AuthProvider.GOOGLE,
      state.referralCode,
    );
  }

  static async handleFacebookCallback({ query }: oauthCallbackSchema) {
    const state = verifyOAuthState(query.state);
    const profile = await getFacebookProfile(query.code);

    return SocialLoginService.findOrCreateUser(
      profile,
      AuthProvider.FACEBOOK,
      state.referralCode,
    );
  }

  private static async findOrCreateUser(
    profile: OAuthProfile,
    provider: AuthProvider,
    referralCode?: string,
  ) {
    let user = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      const newReferralCode = await generateUniqueReferralCode();

      let referredById: string | undefined;

      if (referralCode) {
        const referrer = await prisma.user.findUnique({
          where: { referralCode },
          select: { id: true },
        });

        if (!referrer) {
          throw new ConflictError("Referral code is invalid");
        }

        referredById = referrer.id;
      }

      user = await prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
          authProvider: provider,
          providerId: profile.providerId,

          // Social login sudah terverifikasi oleh provider
          isVerified: true,
          verifiedAt: new Date(),

          // Referral code milik user BARU
          referralCode: newReferralCode,

          // Referral code milik user yang mengundang
          referredById,
        },
      });

      await ReferralService.rewardReferralVoucher(user.id);
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
