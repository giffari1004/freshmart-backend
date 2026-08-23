import { Request, Response } from "express";
import { validate } from "../../validate/validate";
import { SocialLoginValidation } from "./social-login.validation";
import { SocialLoginService } from "./social-login.service";
import { FRONTEND_URL } from "../../configs/env-config";

/**
 * Controller ini SENGAJA menangani error-nya sendiri (try/catch lokal),
 * BEDA dari pola controller lain yang membiarkan error bubble ke
 * ErrorMiddleware global. Alasannya: endpoint ini bagian dari alur
 * redirect penuh di browser (user mid-navigation dari Google/Facebook),
 * bukan dipanggil sebagai API call biasa oleh frontend JS — jadi kalau
 * gagal, responsnya harus tetap berupa REDIRECT ke halaman login
 * frontend (dengan pesan error di query param), bukan JSON mentah yang
 * bakal tampil sebagai halaman kosong/rusak di browser user.
 */
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
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
}
