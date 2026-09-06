import { NextFunction, Request, Response } from "express";
import { CartService } from "./services/cart.service";

export class CartController {
  constructor(private readonly cartService = new CartService()) {}

  addToCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return this.respond(
        res,
        201,
        "Product added to cart",
        await this.cartService.addToCart(req.user!.id, req.body),
      );
    } catch (error) {
      next(error);
    }
  };

  getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return this.respond(
        res,
        200,
        undefined,
        await this.cartService.getCart(req.user!.id),
      );
    } catch (error) {
      next(error);
    }
  };

  updateQuantity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return this.respond(
        res,
        200,
        "cart updated",
        await this.cartService.updateQuantity(
          req.user!.id,
          req.params.id as string,
          req.body,
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return this.respond(
        res,
        200,
        "item removed",
        await this.cartService.removeItem(
          req.user!.id,
          req.params.id as string,
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  clearCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return this.respond(
        res,
        200,
        undefined,
        await this.cartService.clearCart(req.user!.id),
      );
    } catch (error) {
      next(error);
    }
  };

  private respond(
    res: Response,
    status: number,
    message: string | undefined,
    data: unknown,
  ) {
    return res
      .status(status)
      .json({ success: true, ...(message ? { message } : {}), data });
  }
}
