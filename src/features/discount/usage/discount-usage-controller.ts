import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { DiscountUsageService } from "./discount-usage-service";
import { DiscountUsageValidation } from "./discount-usage-validation";
import { validate } from "../../../validate/validate";

export class DiscountUsageController {
  static async getAllUsage(req: Request, res: Response) {
    const { query } = validate(DiscountUsageValidation.GET_ALL_USAGE, {
      query: req.query,
    });
    const user = req.user!;
    const { data, meta } = await DiscountUsageService.getAllUsage({ query }, user);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Discount usage retrieved successfully",
      data: data,
      meta,
    });
  }
}