import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { requireRole } from "../../../middlewares/role-middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../../validate/validation.middleware";
import { OrderAdminController } from "./order-admin.controller";
import {
  orderAdminListSchema,
  orderAdminUpdateSchema,
} from "./order-admin.type";

const router = Router();
const controller = new OrderAdminController();

router.use(
  authMiddleware,
  requireRole("STORE_ADMIN", "SUPER_ADMIN"),
);

router.get(
  "/",
  validateQuery(orderAdminListSchema.shape.query),
  controller.getOrders,
);

router.patch(
  "/:id/status",
  validateParams(orderAdminUpdateSchema.shape.params),
  validateBody(orderAdminUpdateSchema.shape.body),
  controller.updateStatus,
);

export default router;
