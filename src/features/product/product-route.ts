import { Router } from "express";
import { ProductController } from "./product-controller";
import { authMiddleware } from "../../middlewares/auth-middleware";
import { requireRole } from "../../middlewares/role-middleware";
import { upload } from "../../middlewares/upload-middleware";

export const productRoute = Router();

productRoute.use(authMiddleware);

productRoute.get(
  "/",
  requireRole("SUPER_ADMIN", "STORE_ADMIN"),
  ProductController.getAll,
);
productRoute.post(
  "/",
  requireRole("SUPER_ADMIN"),
  upload.array("images", 5),
  ProductController.create,
);
productRoute.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  ProductController.update,
);
productRoute.delete(
  "/:id",
  requireRole("SUPER_ADMIN"),
  ProductController.delete,
);
