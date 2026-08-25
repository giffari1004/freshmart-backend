import { NextFunction, Request, Response } from "express";
import { UnAuthorizedError } from "../../../errors/UnauthorizedError";
import { OrderAdminService } from "./order-admin.service";
import { OrderAdminListInput, OrderAdminUpdateInput } from "./order-admin.type";

export class OrderAdminController {
  constructor(private readonly orderAdminService = new OrderAdminService()) {}

  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = this.getUser(req);
      const query = req.query as unknown as OrderAdminListInput["query"];

      const data = await this.orderAdminService.getOrders(
        query,
        user.storeId,
      );

      return res.status(200).json({
        success: true,
        message: "Admin orders retrieved successfully",
        data: {
          items: data.orders,
          pagination: {
            page: data.page,
            limit: data.limit,
            totalItems: data.totalItems,
            totalPages: Math.ceil(data.totalItems / data.limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = this.getUser(req);
      const input = {
        params: req.params,
        body: req.body,
      } as OrderAdminUpdateInput;

      const data = await this.orderAdminService.updateStatus(
        input.params.id,
        input.body.status,
        user.id,
        user.storeId,
      );

      return res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  private getUser(req: Request) {
    if (!req.user) {
      throw new UnAuthorizedError("Unauthorized");
    }
    return req.user;
  }
}
