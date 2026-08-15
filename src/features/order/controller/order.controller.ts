import { NextFunction, Request, Response } from "express";
import { OrderService } from "../services/order.services";

export class OrderController {
  constructor(private readonly orderService = new OrderService()) {}

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
