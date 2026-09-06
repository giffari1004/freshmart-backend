import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../../validate/validate";
import { DiscountValidation } from "./discount-validation";
import { DiscountService } from "./discount-service";

export class DiscountController {
  static async create(req: Request, res: Response) {
    const { body } = validate(DiscountValidation.CREATE_DISCOUNT, {
      body: req.body,
    });
    const discount = await DiscountService.create({ body }, req.user!);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Discount created successfully",
      data: discount,
    });
  }
  static async update(req: Request, res: Response) {
    const { params, body } = validate(DiscountValidation.UPDATE_DISCOUNT, {
      params: req.params,
      body: req.body,
    });
    const discount = await DiscountService.update({ params, body }, req.user!);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Discount updated successfully",
      data: discount,
    });
  }
  static async delete(req: Request, res: Response) {
    const { params } = validate(DiscountValidation.DELETE_DISCOUNT, {
      params: req.params,
    });
    const discount = await DiscountService.delete({ params }, req.user!);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Discount deleted successfully",
      data: discount,
    });
  }
  static async getAll(req: Request, res: Response) {
    const { query } = validate(DiscountValidation.GET_DISCOUNTS, {
      query: req.query,
    });
    const { data, meta } = await DiscountService.getAll({ query });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Discounts retrieved successfully",
      data,
      meta,
    });
  }
}
