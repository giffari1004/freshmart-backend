import { Router } from "express";
import { SocialLoginController } from "./social-login.controller";

export const socialLoginRoute = Router();

// Semua route di sini PUBLIK — ini alur redirect browser penuh
// (user diarahkan keluar ke Google/Facebook, lalu dibawa balik ke sini),
// bukan API call dari frontend JS, jadi tidak relevan dipasangi
// authMiddleware/rate limiter khusus seperti features/auth.
socialLoginRoute.get("/google", SocialLoginController.redirectToGoogle);
socialLoginRoute.get("/google/callback", SocialLoginController.googleCallback);
socialLoginRoute.get("/facebook", SocialLoginController.redirectToFacebook);
socialLoginRoute.get(
  "/facebook/callback",
  SocialLoginController.facebookCallback,
);
