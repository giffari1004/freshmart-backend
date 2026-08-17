import { Router } from "express";

import { authMiddleware } from "../../../middlewares/auth-middleware"

import { OrderController } from "../controller/order.controller";
import { createOrderSchema } from "../validation/order.validation";
import { requireVerified } from "../../../middlewares/verified-middleware";

const router = Router();

const orderController =
  new OrderController();

router.post(
  "/",
  authMiddleware,
  requireVerified,
  (req, res, next) => {
    const result =
      createOrderSchema.safeParse(
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
  orderController.createOrder,
);

export default router;