import { Router } from "express";
import { CartController } from "./cart.controller";
import { authMiddleware } from "../../middlewares/auth-middleware";

const router = Router();

const cartController = new CartController();

router.use(authMiddleware);

router.get("/", cartController.getCart);

router.post("/items", cartController.addToCart);

router.patch("/items/:id", cartController.updateQuantity);

router.delete("/items/:id", cartController.removeItem);

router.delete("/", cartController.clearCart);

export default router;
