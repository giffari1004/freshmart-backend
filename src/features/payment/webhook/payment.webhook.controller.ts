import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  PaymentWebhookService,
} from "./payment.webhook.service";

import {
  MidtransWebhookRequest,
} from "./payment.webhook.type";

export class PaymentWebhookController {
  constructor(
    private readonly paymentWebhookService =
      new PaymentWebhookService(),
  ) {}

  handleWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const payload =
        req.body as MidtransWebhookRequest;

      const result =
        await this.paymentWebhookService
          .handleWebhook(payload);

      return res.status(200).json({
        success:
          result.success,

        message:
          result.message,
      });
    } catch (error) {
      next(error);
    }
  };
}