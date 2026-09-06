import { Router } from "express";
import { CategoryController } from "./category-controller";
import { authMiddleware } from "../../middlewares/auth-middleware";
import { requireRole } from "../../middlewares/role-middleware";

export const categoryRouter = Router();
categoryRouter.get(
  "/",
  CategoryController.getAll,
);
categoryRouter.post(
  "/",
  authMiddleware,
  requireRole("SUPER_ADMIN"),
  CategoryController.create,
);
categoryRouter.patch(
  "/:id",
  authMiddleware,
  requireRole("SUPER_ADMIN"),
  CategoryController.update,
);
categoryRouter.delete(
  "/:id",
  authMiddleware,
  requireRole("SUPER_ADMIN"),
  CategoryController.delete,
);
