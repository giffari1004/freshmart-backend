import { Router } from "express";
import { validateBody } from "../../../validate/validation.middleware";
import { PaymentWebhookController } from "./payment.webhook.controller";
import { paymentWebhookSchema } from "./payment.webhook.validation";

const router = Router();
const paymentWebhookController = new PaymentWebhookController();
router.post(
  "/",
  validateBody(paymentWebhookSchema),
  paymentWebhookController.handleWebhook,
);
export default router;
