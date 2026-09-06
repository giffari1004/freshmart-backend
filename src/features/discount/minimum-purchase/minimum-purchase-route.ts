import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { requireRole } from "../../../middlewares/role-middleware";
import { MinimumPurchaseDiscountController } from "./minimum-purchase-controller";

export const minimumPurchaseDiscountRoute = Router();
minimumPurchaseDiscountRoute.get("/", MinimumPurchaseDiscountController.getAll);
minimumPurchaseDiscountRoute.use(
  authMiddleware,
  requireRole("SUPER_ADMIN", "STORE_ADMIN"),
);
minimumPurchaseDiscountRoute.post(
  "/",
  MinimumPurchaseDiscountController.create,
);
minimumPurchaseDiscountRoute.patch(
  "/:id",
  MinimumPurchaseDiscountController.update,
);
minimumPurchaseDiscountRoute.delete(
  "/:id",
  MinimumPurchaseDiscountController.delete,
);
