import { NextFunction, Request, Response } from "express";
import { PaymentWebhookService } from "./payment.webhook.service";

export class PaymentWebhookController {
  constructor(
    private readonly paymentWebhookService = new PaymentWebhookService(),
  ) {}

  handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res
        .status(200)
        .json(await this.paymentWebhookService.handleWebhook(req.body));
    } catch (error) {
      next(error);
    }
  };
}
