import { Router } from "express";
import { StoreController } from "./store.controller";
import { authMiddleware } from "../../middlewares/auth-middleware";
import { requireRole } from "../../middlewares/role-middleware";

export const storeRoute = Router();

// Store Management (Feature 1) — requirement eksplisit: "Store admin
// tidak dapat mengakses fitur ini", jadi seluruh route di bawah ini
// SUPER_ADMIN only.
storeRoute.use(authMiddleware, requireRole("SUPER_ADMIN"));

storeRoute.get("/", StoreController.getAll);
storeRoute.get("/:id", StoreController.getById);
storeRoute.post("/", StoreController.create);
storeRoute.patch("/:id", StoreController.update);
storeRoute.delete("/:id", StoreController.delete);
storeRoute.patch("/:id/assign-admin", StoreController.assignAdmin);
