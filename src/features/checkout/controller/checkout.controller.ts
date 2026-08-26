import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../../validate/validate";
import { CheckoutService } from "../services/checkout.service";
import {
  CheckoutPreviewRequest,
} from "../checkout.types";
import {
  checkoutShippingOptionsQuerySchema,
} from "../validations/checkout.validation";

export class CheckoutController {
  constructor(
    private readonly checkoutService =
      new CheckoutService(),
  ) {}

  getCheckoutPreview = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      return res
        .status(StatusCodes.OK)
        .json({
          success: true,
          message:
            "Checkout preview retrieved successfully",
          data:
            await this.checkoutService.getCheckoutPreview(
              req.user!.id,
              req.body as CheckoutPreviewRequest,
            ),
        });
    } catch (error) {
      next(error);
    }
  };

  getShippingOptions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = validate(
      checkoutShippingOptionsQuerySchema,
      req.query,
    );

    const data =
      await this.checkoutService.getShippingOptions(
        req.user!.id,
        query.addressId,
      );

    return res.status(StatusCodes.OK).json({
      success: true,
      message:
        "Checkout shipping options retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};
}