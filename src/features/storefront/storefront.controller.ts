import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../validate/validate";
import { StorefrontValidation } from "./storefront.validation";
import { StorefrontService } from "./storefront.service";

export class StorefrontController {
  static async getNearestStore(req: Request, res: Response) {
    const { query } = validate(StorefrontValidation.GET_NEAREST_STORE, {
      query: req.query,
    });
    const result = await StorefrontService.getNearestStore({ query });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Nearest store retrieved successfully",
      data: result,
    });
  }

  static async getCategories(_req: Request, res: Response) {
    const categories = await StorefrontService.getCategories();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  }

  static async getPromotions(req: Request, res: Response) {
    const { query } = validate(StorefrontValidation.GET_PROMOTIONS, {
      query: req.query,
    });
    const promotions = await StorefrontService.getPromotions({ query });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Promotions retrieved successfully",
      data: promotions,
    });
  }
}
