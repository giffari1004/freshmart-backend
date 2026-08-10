import { Router } from "express";
import { CheckoutController } from "../controller/checkout.controller";
import { authMiddleware } from "../../../middlewares/auth-middleware";

export const checkoutRouter = Router();

const controller = new CheckoutController();

checkoutRouter.post(
  "/preview",
  authMiddleware,
  controller.getCheckoutPreview,
);

export default checkoutRouter;