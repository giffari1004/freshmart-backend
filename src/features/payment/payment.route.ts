import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth-middleware";

import { PaymentController } from "./payment.controller";
import { createPaymentSchema } from "./payment.validation";

const router = Router();

const paymentController =
  new PaymentController();

router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    const result =
      createPaymentSchema.safeParse(
        req.body,
      );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        errors:
          result.error.flatten(),
      });
    }

    req.body = result.data;

    next();
  },
  paymentController.createPayment,
);

export default router;