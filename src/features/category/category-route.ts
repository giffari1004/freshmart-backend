import { Router } from "express";
import { CategoryController } from "./category-controller";
import { authMiddleware } from "../../middlewares/auth-middleware";
import { requireRole } from "../../middlewares/role-middleware";

export const categoryRouter = Router();

categoryRouter.use(authMiddleware);
categoryRouter.get(
  "/",
  requireRole("SUPER_ADMIN", "STORE_ADMIN"),
  CategoryController.getAll,
);
categoryRouter.post("/", requireRole("SUPER_ADMIN"), CategoryController.create);
categoryRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  CategoryController.update,
);
categoryRouter.delete(
  "/:id",
  requireRole("SUPER_ADMIN"),
  CategoryController.delete,
);
