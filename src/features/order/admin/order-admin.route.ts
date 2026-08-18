import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { requireRole } from "../../../middlewares/role-middleware";
import { OrderAdminController } from "./order-admin.controller";

const router = Router();
const controller = new OrderAdminController();

router.use(authMiddleware, requireRole("STORE_ADMIN", "SUPER_ADMIN"));
router.get("/", controller.list);
router.patch("/:id/status", controller.update);

export default router;
