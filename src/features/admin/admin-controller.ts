import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export class AdminController {
  static async create(req: Request, res: Response) {
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Admin created successfully",
      data: null,
    });
  }
  static async get(req: Request, res: Response) {
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Admin retrieved successfully",
      data: null,
    });
  }
  static async update(req: Request, res: Response) {
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Admin updated successfully",
      data: null,
    });
  }
  static async delete(req: Request, res: Response) {
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Admin deleted successfully",
      data: null,
    });
  }
}
