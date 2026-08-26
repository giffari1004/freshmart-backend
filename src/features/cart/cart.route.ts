import { Router } from "express";
import { CartController } from "./cart.controller";
import { authMiddleware } from "../../middlewares/auth-middleware";
import { validateBody, validateParams } from "../../validate/validation.middleware";
import { addToCartSchema, updateCartSchema, cartItemParamSchema } from "./validations/cart.validation";
import { requireVerified } from "../../middlewares/verified-middleware";

const router = Router();

const cartController = new CartController();

router.use(authMiddleware);

router.get("/", cartController.getCart);

router.post(
  "/items",
  requireVerified,
  validateBody(addToCartSchema),
  cartController.addToCart,
);

router.patch(
  "/items/:id",
  validateParams(cartItemParamSchema),
  validateBody(updateCartSchema),
  cartController.updateQuantity,
);

router.delete(
  "/items/:id",
  validateParams(cartItemParamSchema),
  cartController.removeItem,
);

router.delete("/", cartController.clearCart);

export default router;
