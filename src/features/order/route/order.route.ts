import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { validateBody } from "../../../validate/validation.middleware";
import { OrderController } from "../controller/order.controller";
import { createOrderSchema } from "../validation/order.validation";

const router = Router();
const orderController = new OrderController();
router.post(
  "/",
  authMiddleware,
  validateBody(createOrderSchema),
  orderController.createOrder,
);
export default router;
