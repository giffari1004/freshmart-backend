import {
  Request,
  Response,
  NextFunction,
} from "express";

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
      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const payload =
        req.body as CreatePaymentRequest;

      const result =
        await this.paymentService.createPayment(
          userId,
          payload,
        );

      return res.status(200).json({
        success: true,
        message:
          "Payment token generated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}