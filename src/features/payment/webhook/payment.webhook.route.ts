import { Router } from "express";

import {
  PaymentWebhookController,
} from "./payment.webhook.controller";

import {
  paymentWebhookSchema,
} from "./payment.webhook.validation";

const router = Router();

const paymentWebhookController =
  new PaymentWebhookController();

router.post(
  "/",
  (req, res, next) => {
    const result =
      paymentWebhookSchema.safeParse(
        req.body,
      );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid webhook payload",
        errors:
          result.error.flatten(),
      });
    }

    req.body = result.data;

    next();
  },
  paymentWebhookController.handleWebhook,
);

export default router;