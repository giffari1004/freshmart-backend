import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { DiscountCalculateService } from "./discount-calculate-service";
import { DiscountCalculateValidation } from "./discount-calculate-validation";
import { validate } from "../../../validate/validate";

export class DiscountCalculatorController {
  static async calculateDiscount(req: Request, res: Response) {
    const { body } = validate(DiscountCalculateValidation.CALCULATE_DISCOUNT, {
      body: req.body,
    });
    const result = await DiscountCalculateService.calculate({ body });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Discount calculated successfully",
      data: result,
    });
  }
}