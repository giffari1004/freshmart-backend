import express, { Router } from "express";
import { validateBody } from "../../../validate/validation.middleware";
import { PaymentWebhookController } from "./payment.webhook.controller";
import { paymentWebhookSchema } from "./payment.webhook.validation";

const router = Router();
const paymentWebhookController = new PaymentWebhookController();

/*
 * Midtrans normally sends JSON, but accepting URL-encoded payloads here
 * makes the webhook endpoint resilient to gateway/proxy content-type
 * differences without changing the rest of the API.
 *
 * These parsers are scoped to the webhook route and therefore do not
 * alter Cart/Checkout/Order request parsing.
 */
router.use(express.json({ limit: "256kb" }));
router.use(express.urlencoded({ extended: false, limit: "256kb" }));

router.post(
  "/",
  validateBody(paymentWebhookSchema),
  paymentWebhookController.handleWebhook,
);

export default router;
