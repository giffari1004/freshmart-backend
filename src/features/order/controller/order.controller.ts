import { Request, Response } from "express";

import { OrderService } from "../services/order.services";
import { CreateOrderRequest } from "../order.type";

export class OrderController {
  constructor(
    private readonly orderService =
      new OrderService(),
  ) {}

  createOrder = async (
    req: Request,
    res: Response,
  ) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const payload =
      req.body as CreateOrderRequest;

    const order =
      await this.orderService.createOrder(
        userId,
        payload,
      );

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  };
}