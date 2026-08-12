import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authLimiter } from "../../middlewares/rate-limiter-middleware";

export const authRoute = Router();

// Semua route di bawah ini PUBLIK (tanpa authMiddleware) — orang yang
// belum punya akun/token justru butuh akses ke endpoint-endpoint ini.
// authLimiter dipasang karena ini titik paling rawan brute-force/abuse.
authRoute.post("/register", authLimiter, AuthController.register);
authRoute.post("/verify-email", authLimiter, AuthController.verifyEmail);
authRoute.post(
  "/resend-verification",
  authLimiter,
  AuthController.resendVerification,
);
authRoute.post("/login", authLimiter, AuthController.login);
authRoute.post(
  "/reset-password",
  authLimiter,
  AuthController.requestResetPassword,
);
authRoute.post(
  "/reset-password/confirm",
  authLimiter,
  AuthController.confirmResetPassword,
);
