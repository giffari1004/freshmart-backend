import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../../validate/validation.middleware";
import { OrderController } from "../controller/order.controller";
import {
  createOrderSchema,
  orderIdParamSchema,
  orderListQuerySchema,
} from "../validation/order.validation";

const router = Router();
const orderController = new OrderController();

router.use(authMiddleware);

router.get(
  "/",
  validateQuery(orderListQuerySchema),
  orderController.getOrders,
);

router.get(
  "/:id",
  validateParams(orderIdParamSchema),
  orderController.getOrderDetail,
);

router.post(
  "/:id/cancel",
  validateParams(orderIdParamSchema),
  orderController.cancelOrder,
);

router.post(
  "/:id/confirm",
  validateParams(orderIdParamSchema),
  orderController.confirmOrder,
);

router.post(
  "/",
  validateBody(createOrderSchema),
  orderController.createOrder,
);

export default router;
