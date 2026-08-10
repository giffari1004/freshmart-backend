import { NextFunction, Request, Response } from "express";
import { CartService } from "./services/cart.service";

export class CartController {
  constructor(private readonly cartService = new CartService()) {}

  addToCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.cartService.addToCart(req.user!.id, req.body);

      res.status(201).json({
        success: true,
        message: "Product added to this.cartService.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.cartService.getCart(req.user!.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateQuantity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.cartService.updateQuantity(
        req.user!.id,
        req.params.id as string,
        req.body,
      );
      res.status(200).json({
        success: true,
        message: "cart updated",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.cartService.removeItem(
        req.user!.id,
        req.params.id as string,
      );
      res.status(200).json({
        success: true,
        message: "item removed",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  clearCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.cartService.clearCart(req.user!.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
