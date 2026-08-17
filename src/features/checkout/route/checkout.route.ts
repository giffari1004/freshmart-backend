import { Router } from "express";
import { CheckoutController } from "../controller/checkout.controller";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { requireVerified } from "../../../middlewares/verified-middleware";

export const checkoutRouter = Router();

const controller = new CheckoutController();

checkoutRouter.post(
  "/preview",
  authMiddleware,
  requireVerified,
  controller.getCheckoutPreview,
);

export default checkoutRouter;