import { Request, Response, NextFunction } from "express";
import { validate } from "../../../validate/validate";
import { orderAdminListSchema, orderAdminUpdateSchema } from "./order-admin.type";
import { OrderAdminService } from "./order-admin.service";

export class OrderAdminController {
  constructor(private readonly service = new OrderAdminService()) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = validate(orderAdminListSchema, { query: req.query });
      const storeId = this.getStoreScope(req);
      const result = await this.service.list(storeId, query.page, query.limit, query.status);
      return res.status(200).json({
        success: true,
        message: "Admin orders retrieved successfully",
        data: result.orders,
        meta: { page: query.page, limit: query.limit, totalData: result.total, totalPages: Math.ceil(result.total / query.limit) },
      });
    } catch (error) {
      next(error);
    }
  };

  private getStoreScope(req: Request) {
    if (req.user!.role === "SUPER_ADMIN") return null;
    if (!req.user!.storeId) throw new Error("Store admin is not assigned to a store");
    return req.user!.storeId;
  }

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { params, body } = validate(orderAdminUpdateSchema, {
        params: req.params,
        body: req.body,
      });
      const storeId = this.getStoreScope(req);
      const data = await this.service.update(params.id, storeId, body);
      return res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
