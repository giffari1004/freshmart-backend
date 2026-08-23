import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { requireRole } from "../../../middlewares/role-middleware";
import { DiscountController } from "./discount-controller";

export const discountRoute = Router();

discountRoute.use(authMiddleware, requireRole("SUPER_ADMIN", "STORE_ADMIN"));

discountRoute.post("/", DiscountController.create);
discountRoute.patch("/:id", DiscountController.update);
discountRoute.delete("/:id", DiscountController.delete);
