import { Request, Response } from "express";
import { CheckoutService } from "../services/checkout.service";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";
import { UnAuthorizedError } from "../../../errors/UnauthorizedError";

export class CheckoutController {
  constructor(
    private readonly checkoutService = new CheckoutService(),
  ) {}

  getCheckoutPreview = async (
    req: Request,
    res: Response,
  ) => {
   if (!req.user) {
    throw new UnAuthorizedError("Unauthorized");
}

const userId = req.user.id;

    const result =
      await this.checkoutService.getCheckoutPreview(userId);

    res.status(200).json({
      success: true,
      message: CHECKOUT_MESSAGE.PREVIEW_SUCCESS,
      data: result,
    });
  };
}