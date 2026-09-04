import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { VourcherPublicController } from "./vourcher.public-controller";

export const voucherPublicRoute = Router();
voucherPublicRoute.get(
  "/validate/:code",
  authMiddleware,
  VourcherPublicController.validateCode,
);