import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../validate/validate";
import { ProfileValidation } from "./profile.validation";
import { ProfileService } from "./profile.service";

export class ProfileController {
  static async getProfile(req: Request, res: Response) {
    const profile = await ProfileService.getProfile(req.user!.id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile retrieved successfully",
      data: profile,
    });
  }

  static async updateProfile(req: Request, res: Response) {
    const { body } = validate(ProfileValidation.UPDATE_PROFILE, {
      body: req.body,
    });
    const profile = await ProfileService.updateProfile(req.user!.id, {
      body,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  }

  static async updateAvatar(req: Request, res: Response) {
    const profile = await ProfileService.updateAvatar(req.user!.id, req.file);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Avatar updated successfully",
      data: profile,
    });
  }

  static async updateEmail(req: Request, res: Response) {
    const { body } = validate(ProfileValidation.UPDATE_EMAIL, {
      body: req.body,
    });
    const profile = await ProfileService.updateEmail(req.user!.id, { body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Email updated, please verify your new email",
      data: profile,
    });
  }

  static async updatePassword(req: Request, res: Response) {
    const { body } = validate(ProfileValidation.UPDATE_PASSWORD, {
      body: req.body,
    });
    const result = await ProfileService.updatePassword(req.user!.id, {
      body,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      data: null,
    });
  }
}
