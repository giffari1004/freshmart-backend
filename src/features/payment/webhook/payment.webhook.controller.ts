import { NextFunction, Request, Response } from "express";
import { PaymentWebhookService } from "./payment.webhook.service";

export class PaymentWebhookController {
  constructor(
    private readonly paymentWebhookService: PaymentWebhookService =
      new PaymentWebhookService(),
  ) {}

  handleWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data =
        await this.paymentWebhookService.handleWebhook(
          req.body,
        );

      return res.status(200).json({
        success: true,
        message: "Midtrans webhook processed successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}