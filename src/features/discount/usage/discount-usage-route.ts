import { Router } from "express";
import { DiscountUsageController } from "./discount-usage-controller";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { requireRole } from "../../../middlewares/role-middleware";

export const discountUsageRoute = Router();
discountUsageRoute.use(authMiddleware);

discountUsageRoute.get(
  "/",
  requireRole("STORE_ADMIN", "SUPER_ADMIN"),
  DiscountUsageController.getAllUsage,
);