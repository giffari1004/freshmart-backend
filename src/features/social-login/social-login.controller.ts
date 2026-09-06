import { Request, Response } from "express";
import { validate } from "../../validate/validate";
import { SocialLoginValidation } from "./social-login.validation";
import { SocialLoginService } from "./social-login.service";
import { FRONTEND_URL } from "../../configs/env-config";
import { error } from "console";

export class SocialLoginController {
  static redirectToGoogle(_req: Request, res: Response) {
    res.redirect(SocialLoginService.getGoogleRedirectUrl());
  }

  static async googleCallback(req: Request, res: Response) {
    if (req.query.error) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_cancelled`);
    }

    try {
      const { query } = validate(SocialLoginValidation.OAUTH_CALLBACK, {
        query: req.query,
      });
      const { accessToken } = await SocialLoginService.handleGoogleCallback({
        query,
      });
      return res.redirect(`${FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch {
      console.error("Google OAuth callback failed:", error);
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  }

  static redirectToFacebook(_req: Request, res: Response) {
    res.redirect(SocialLoginService.getFacebookRedirectUrl());
  }

  static async facebookCallback(req: Request, res: Response) {
    if (req.query.error) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_cancelled`);
    }

    try {
      const { query } = validate(SocialLoginValidation.OAUTH_CALLBACK, {
        query: req.query,
      });
      const { accessToken } = await SocialLoginService.handleFacebookCallback({
        query,
      });
      return res.redirect(`${FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch {
      console.error("Facebook OAuth callback failed:", error);
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
}
