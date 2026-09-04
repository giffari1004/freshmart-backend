import { NextFunction, Request, Response } from "express";
import { PaymentService } from "./payment.service";

export class PaymentController {
  constructor(private readonly paymentService = new PaymentService()) {}

  createPayment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      return res.status(200).json({
        success: true,
        message: "Payment token generated successfully",
        data: await this.paymentService.createPayment(
          req.user!.id,
          req.body,
        ),
      });
    } catch (error) {
      next(error);
    }
  };
}