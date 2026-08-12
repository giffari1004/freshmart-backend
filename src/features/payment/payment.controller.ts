import { Request, Response, NextFunction } from "express";

import { PaymentService } from "./payment.service";
import { CreatePaymentRequest } from "./payment.type";

export class PaymentController {
  constructor(
    private readonly paymentService =
      new PaymentService(),
  ) {}

  createPayment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const payload =
        req.body as CreatePaymentRequest;

      const result =
        await this.paymentService.createPayment(
          payload,
        );

      return res.status(201).json({
        success: true,
        message:
          "Payment created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}