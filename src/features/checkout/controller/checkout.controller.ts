import { NextFunction, Request, Response } from "express";
import { CheckoutService } from "../services/checkout.service";
import { CheckoutPreviewRequest } from "../checkout.types";

export class CheckoutController {
  constructor(private readonly checkoutService = new CheckoutService()) {}

  getCheckoutPreview = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      return res
        .status(200)
        .json({
          success: true,
          message: "Checkout preview retrieved successfully",
          data: await this.checkoutService.getCheckoutPreview(
            req.user!.id,
            req.body as CheckoutPreviewRequest,
          ),
        });
    } catch (error) {
      next(error);
    }
  };
}
