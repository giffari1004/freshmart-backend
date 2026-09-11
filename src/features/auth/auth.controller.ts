import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../validate/validate";
import { AuthValidation } from "./auth.validation";
import { AuthService } from "./auth.service";

export class AuthController {
  static async register(req: Request, res: Response) {
    const { body } = validate(AuthValidation.REGISTER, { body: req.body });
    const user = await AuthService.register({ body });
    res.status(StatusCodes.CREATED).json({
      success: true,
      message:
        "Registration successful, please check your email to verify your account",
      data: user,
    });
  }

  static async verifyEmail(req: Request, res: Response) {
    const { body } = validate(AuthValidation.VERIFY_EMAIL, {
      body: req.body,
    });
    const user = await AuthService.verifyEmail({ body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Email verified successfully, please log in",
      data: user,
    });
  }

  static async resendVerification(req: Request, res: Response) {
    const { body } = validate(AuthValidation.RESEND_VERIFICATION, {
      body: req.body,
    });
    const result = await AuthService.resendVerification({ body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  static async login(req: Request, res: Response) {
    const { body } = validate(AuthValidation.LOGIN, { body: req.body });
    const result = await AuthService.login({ body });

    res.cookie("token", result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  }

  static async requestResetPassword(req: Request, res: Response) {
    const { body } = validate(AuthValidation.REQUEST_RESET_PASSWORD, {
      body: req.body,
    });
    const result = await AuthService.requestResetPassword({ body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  static async confirmResetPassword(req: Request, res: Response) {
    const { body } = validate(AuthValidation.CONFIRM_RESET_PASSWORD, {
      body: req.body,
    });
    const result = await AuthService.confirmResetPassword({ body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.status(StatusCodes.OK).json({ success: true, message: "Logged out" });
  }
}
