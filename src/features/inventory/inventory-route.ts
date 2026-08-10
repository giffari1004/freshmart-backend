import { Router } from "express";
import { InventoryController } from "./inventory-controller";
import { authMiddleware } from "../../middlewares/auth-middleware";
import { requireRole } from "../../middlewares/role-middleware";

export const inventoryRoute = Router();
inventoryRoute.use(authMiddleware);
inventoryRoute.get(
  "/",
  requireRole("SUPER_ADMIN", "STORE_ADMIN"),
  InventoryController.getAllInventory,
);
inventoryRoute.post(
  "/",
  requireRole("SUPER_ADMIN"),
  InventoryController.createInventory,
);
inventoryRoute.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  InventoryController.updateInventory,
);
inventoryRoute.delete(
  "/:id",
  requireRole("SUPER_ADMIN"),
  InventoryController.deleteInventory,
);
inventoryRoute.post(
  "/:id/in",
  requireRole("STORE_ADMIN", "SUPER_ADMIN"),
  InventoryController.stockIn,
);
inventoryRoute.post(
  "/:id/out",
  requireRole("STORE_ADMIN", "SUPER_ADMIN"),
  InventoryController.stockOut,
);
inventoryRoute.get(
  "/:id/history",
  requireRole("STORE_ADMIN", "SUPER_ADMIN"),
  InventoryController.getStockHistory,
);
