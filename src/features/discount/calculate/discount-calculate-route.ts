import { Router } from "express";
import { DiscountCalculatorController } from "./discount-calculate-controller";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { requireRole } from "../../../middlewares/role-middleware";

export const discountCalculateRoute = Router();
discountCalculateRoute.use(authMiddleware);

discountCalculateRoute.post(
  "/",
  requireRole("STORE_ADMIN", "SUPER_ADMIN"),
  DiscountCalculatorController.calculateDiscount,
);