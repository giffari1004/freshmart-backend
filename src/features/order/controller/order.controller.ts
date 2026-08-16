import { NextFunction, Request, Response } from "express";
import { OrderService } from "../services/order.services";

export class OrderController {
  constructor(private readonly orderService = new OrderService()) {}

  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.orderService.getOrders(req.user!.id);
      return res
        .status(200)
        .json({
          success: true,
          message: "Orders retrieved successfully",
          data,
        });
    } catch (error) {
      next(error);
    }
  };

  getOrderDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;

      if (typeof orderId !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }

      const data = await this.orderService.getOrderDetail(
        orderId,
        req.user!.id,
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

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res
        .status(201)
        .json({
          success: true,
          message: "Order created successfully",
          data: await this.orderService.createOrder(req.user!.id, req.body),
        });
    } catch (error) {
      next(error);
    }
  };
}
