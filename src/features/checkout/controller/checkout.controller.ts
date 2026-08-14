import { NextFunction, Request, Response } from "express";
import { validate } from "../../../validate/validate";
import { CheckoutPreviewRequest } from "../checkout.types";
import { checkoutPreviewSchema } from "../validations/checkout.validation";
import { CheckoutService } from "../services/checkout.service";

export class CheckoutController {
  constructor(
    private readonly checkoutService = new CheckoutService(),
  ){}

  getCheckoutPreview = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user){
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      const payload = validate(
        checkoutPreviewSchema,
        {
          body: req.body,
        },
      ).body as CheckoutPreviewRequest;

      const result = 
      await this.checkoutService.getCheckoutPreview(
        req.user.id,
        payload,
      );

      return res.status(200).json({
        success: true,
        message: "Checkout preview retrieved successfully",
        data: result,
      });
    } catch (error){
      next(error);
    }
  };
  
}