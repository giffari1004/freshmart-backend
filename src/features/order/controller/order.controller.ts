import { NextFunction, Request, Response } from "express";
import { UnAuthorizedError } from "../../../errors/UnauthorizedError";
import { OrderService } from "../services/order.services";
import { orderListQuerySchema } from "../validation/order.validation";

export class OrderController {
  constructor(
    private readonly orderService = new OrderService(),
  ) {}

  getOrders = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = this.getUserId(req);
      const query = orderListQuerySchema.parse(req.query);
      const data = await this.orderService.getOrders(userId, query);

      return res.status(200).json({
        success: true,
        message: "Orders retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getOrderDetail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const orderId = this.getOrderId(req);
      const userId = this.getUserId(req);
      const data = await this.orderService.getOrderDetail(
        orderId,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: "Order detail retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  cancelOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const orderId = this.getOrderId(req);
      const userId = this.getUserId(req);
      const data = await this.orderService.cancelOrder(
        orderId,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  confirmOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const orderId = this.getOrderId(req);
      const userId = this.getUserId(req);
      const data = await this.orderService.confirmOrder(
        orderId,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: "Order confirmed successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  createOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = this.getUserId(req);
      const data = await this.orderService.createOrder(
        userId,
        req.body,
      );

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  private getUserId(req: Request): string {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnAuthorizedError("Unauthorized");
    }

    return userId;
  }

  private getOrderId(req: Request): string {
    const orderId = req.params.id;

    if (typeof orderId !== "string") {
      throw new Error("Invalid order ID");
    }

    return orderId;
  }
}
