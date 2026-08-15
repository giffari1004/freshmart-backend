import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth-middleware";
import { validateBody } from "../../validate/validation.middleware";
import { PaymentController } from "./payment.controller";
import { createPaymentSchema } from "./payment.validation";
import paymentWebhookRouter from "./webhook/payment.webhook.route";

const router = Router();
const paymentController = new PaymentController();
router.use("/webhook", paymentWebhookRouter);
router.post(
  "/",
  authMiddleware,
  validateBody(createPaymentSchema),
  paymentController.createPayment,
);
export default router;
