import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { requireRole } from "../../../middlewares/role-middleware";
import { BogoController } from "./bogo-controller";

export const bogoRoute = Router();

bogoRoute.use(authMiddleware, requireRole("SUPER_ADMIN", "STORE_ADMIN"));

bogoRoute.post("/", BogoController.create);
bogoRoute.patch("/:id", BogoController.update);
bogoRoute.delete("/:id", BogoController.delete);