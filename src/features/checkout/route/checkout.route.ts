import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { validateBody } from "../../../validate/validation.middleware";
import { CheckoutController } from "../controller/checkout.controller";
import { checkoutPreviewSchema } from "../validations/checkout.validation";

export const checkoutRouter = Router();
const controller = new CheckoutController();

checkoutRouter.get(
  "/shipping-options",
  authMiddleware,
  controller.getShippingOptions,
);

checkoutRouter.post(
  "/preview",
  authMiddleware,
  validateBody(checkoutPreviewSchema),
  controller.getCheckoutPreview,
);

export default checkoutRouter;
