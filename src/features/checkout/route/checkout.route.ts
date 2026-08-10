import { Router } from "express";
import { CheckoutController } from "../controller/checkout.controller";
import { authMiddleware } from "../../../middlewares/auth-middleware";

export const checkoutrouter = Router();

const controller = new CheckoutController();

checkoutrouter.get(
  "/preview",
  authMiddleware,
  controller.getCheckoutPreview.bind(controller),
);

export default checkoutrouter;