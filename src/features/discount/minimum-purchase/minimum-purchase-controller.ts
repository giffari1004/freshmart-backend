import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../../validate/validate";
import { MinimumDiscountValidation } from "./minimum-purchase-validation";
import { MinimumPurchaseDiscountService } from "./minimum-purchase-service";

export class MinimumPurchaseDiscountController {
  static async create(req: Request, res: Response) {
    const { body } = validate(MinimumDiscountValidation.CREATE, {
      body: req.body,
    });
    const discount = await MinimumPurchaseDiscountService.create(
      { body },
      req.user!,
    );
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Minimum purchase discount created successfully",
      data: discount,
    });
  }
  static async update(req: Request, res: Response) {
    const { params, body } = validate(MinimumDiscountValidation.UPDATE, {
      params: req.params,
      body: req.body,
    });
    const discount = await MinimumPurchaseDiscountService.update(
      { params, body },
      req.user!,
    );
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Minimum purchase discount updated successfully",
      data: discount,
    });
  }
  static async delete(req: Request, res: Response) {
    const { params } = validate(MinimumDiscountValidation.DELETE, {
      params: req.params,
    });
    const discount = await MinimumPurchaseDiscountService.delete(
      { params },
      req.user!,
    );
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Minimum purchase discount deleted successfully",
      data: discount,
    });
  }
  static async getAll(req: Request, res: Response) {
    const { query } = validate(MinimumDiscountValidation.GET_MINIMUM_PURCHASE, {
      query: req.query,
    });
    const {data,meta} = await MinimumPurchaseDiscountService.getAll({ query });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Discounts retrieved successfully",
      data,
      meta
    });
  }
}
