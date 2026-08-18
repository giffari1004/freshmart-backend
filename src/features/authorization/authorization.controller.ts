import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthorizationService } from "./authorization.service";

export class AuthorizationController {
  static async getSession(req: Request, res: Response) {
    const session = await AuthorizationService.getSession(req.user!.id);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Session retrieved successfully",
      data: session,
    });
  }
}
