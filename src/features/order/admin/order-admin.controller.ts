import { NextFunction, Request, Response } from "express";
import { UnAuthorizedError } from "../../../errors/UnauthorizedError";
import { OrderAdminService } from "./order-admin.service";
import {
  OrderAdminListInput,
  OrderAdminUpdateInput,
  
} from "./order-admin.type";

export class OrderAdminController {
  constructor(
    private readonly orderAdminService = new OrderAdminService(),
  ) {}

  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = this.getUser(req);
      const query = this.getQuery(res);
      const storeId = resolveStoreScope(user, query.storeId);
      const data = await this.orderAdminService.getOrders(query, storeId);
      return this.sendOrders(res, data);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = this.getUser(req);
      const params = res.locals.validatedParams as OrderAdminUpdateInput["params"];
      const body = res.locals.validatedBody as OrderAdminUpdateInput["body"];
      const data = await this.orderAdminService.updateStatus(
        params.id,
        body.status,
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
    if (!req.user) throw new UnAuthorizedError("Unauthorized");
    return req.user;
  }

  private getQuery(res: Response) {
    return res.locals.validatedQuery as OrderAdminListInput["query"];
  }

  private sendOrders(res: Response, data: Awaited<ReturnType<OrderAdminService["getOrders"]>>) {
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
  }
}

function resolveStoreScope(
  user: { role: string; storeId: string | null },
  filterStoreId?: string,
): string | null {
  return user.role === "STORE_ADMIN"
    ? user.storeId
    : filterStoreId ?? null;
}
