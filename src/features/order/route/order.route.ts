import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { validateBody } from "../../../validate/validation.middleware";
import { OrderController } from "../controller/order.controller";
import {
  createOrderSchema,
} from "../validation/order.validation";

const router = Router();
const orderController = new OrderController();

router.use(authMiddleware);

router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrderDetail);
router.post("/:id/cancel", orderController.cancelOrder);
router.post("/:id/confirm", orderController.confirmOrder);
router.post(
  "/",
  validateBody(createOrderSchema),
  orderController.createOrder,
);

export default router;
