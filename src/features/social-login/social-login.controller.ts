import { Request, Response } from "express";
import { validate } from "../../validate/validate";
import { SocialLoginValidation } from "./social-login.validation";
import { SocialLoginService } from "./social-login.service";
import { FRONTEND_URL } from "../../configs/env-config";

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export class SocialLoginController {
  static redirectToGoogle(req: Request, res: Response) {
    const { query } = validate(SocialLoginValidation.OAUTH_REDIRECT, {
      query: req.query,
    });

    res.redirect(SocialLoginService.getGoogleRedirectUrl(query.ref));
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

      res.cookie("token", accessToken, AUTH_COOKIE_OPTIONS);

      return res.redirect(`${FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch (error) {
      console.error("Google OAuth callback failed:", error);
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  }

  static redirectToFacebook(req: Request, res: Response) {
    const { query } = validate(SocialLoginValidation.OAUTH_REDIRECT, {
      query: req.query,
    });

    res.redirect(SocialLoginService.getFacebookRedirectUrl(query.ref));
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

      res.cookie("token", accessToken, AUTH_COOKIE_OPTIONS);

      return res.redirect(`${FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch (error) {
      console.error("Facebook OAuth callback failed:", error);
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
}
