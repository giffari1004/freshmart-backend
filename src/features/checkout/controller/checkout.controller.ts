import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../../../validate/validate";
import { CheckoutService } from "../services/checkout.service";
import { CheckoutPreviewRequest } from "../checkout.types";
import {
  checkoutShippingOptionsQuerySchema,
  checkoutVouchersQuerySchema,
} from "../validations/checkout.validation";

type Action = () => Promise<unknown>;

export class CheckoutController {
  constructor(private readonly checkoutService = new CheckoutService()) {}

  getCheckoutPreview = (req: Request, res: Response, next: NextFunction) =>
    this.handle(req, res, next, () =>
      this.checkoutService.getCheckoutPreview(
        req.user!.id,
        req.body as CheckoutPreviewRequest,
      ), "Checkout preview retrieved successfully");

  getVouchers = (req: Request, res: Response, next: NextFunction) =>
    this.handle(req, res, next, () => {
      const { storeId } = validate(checkoutVouchersQuerySchema, req.query);
      return this.checkoutService.getVouchers(req.user!.id, storeId);
    }, "Checkout vouchers retrieved successfully");

  getShippingOptions = (req: Request, res: Response, next: NextFunction) =>
    this.handle(req, res, next, () => {
      const { addressId } = validate(
        checkoutShippingOptionsQuerySchema,
        req.query,
      );
      return this.checkoutService.getShippingOptions(req.user!.id, addressId);
    }, "Checkout shipping options retrieved successfully");

  private async handle(
    req: Request,
    res: Response,
    next: NextFunction,
    action: Action,
    message: string,
  ) {
    try {
      const data = await action();
      return res.status(StatusCodes.OK).json({ success: true, message, data });
    } catch (error) {
      next(error);
    }
  }
}
