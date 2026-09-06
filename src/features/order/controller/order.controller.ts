import { NextFunction, Request, Response } from "express";
import { UnAuthorizedError } from "../../../errors/UnauthorizedError";
import { OrderService } from "../services/order.services";
import type { OrderListQuery } from "../order.type";

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

    const query =
      res.locals.validatedQuery as OrderListQuery;

    const result = await this.orderService.getOrders(
      userId,
      query,
    );

    return res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

  getOrderDetail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const orderId = this.getOrderId(res);
      const userId = this.getUserId(req);

      const data =
        await this.orderService.getOrderDetail(
          orderId,
          userId,
        );

      return res.status(200).json({
        success: true,
        message: "Order detail retrieved successfully",
        data,
      });
    } catch (error) {
      return next(error);
    }
  };

  cancelOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const orderId = this.getOrderId(res);
      const userId = this.getUserId(req);

      const data =
        await this.orderService.cancelOrder(
          orderId,
          userId,
        );

      return res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        data,
      });
    } catch (error) {
      return next(error);
    }
  };

  confirmOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const orderId = this.getOrderId(res);
      const userId = this.getUserId(req);

      const data =
        await this.orderService.confirmOrder(
          orderId,
          userId,
        );

      return res.status(200).json({
        success: true,
        message: "Order confirmed successfully",
        data,
      });
    } catch (error) {
      return next(error);
    }
  };

  createOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = this.getUserId(req);

      const data =
        await this.orderService.createOrder(
          userId,
          req.body,
        );

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data,
      });
    } catch (error) {
      return next(error);
    }
  };

  private getUserId(req: Request): string {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnAuthorizedError("Unauthorized");
    }

    return userId;
  }

  private getOrderId(res: Response): string {
    const orderId =
      res.locals.validatedParams?.id;

    if (!orderId) {
      throw new UnAuthorizedError(
        "Order ID is required",
      );
    }

    return orderId as string;
  }
}