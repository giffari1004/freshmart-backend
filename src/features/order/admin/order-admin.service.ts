import { BadRequestError } from "../../../errors/BadRequestError";
import { NotFoundError } from "../../../errors/NotFoundError";
import { OrderAdminRepository } from "./order-admin.repository";
import { OrderAdminUpdateInput } from "./order-admin.type";

const TRANSITIONS = {
  PROCESSING: ["PAID"],
  SHIPPED: ["PROCESSING"],
  CANCELLED: ["PAID", "PROCESSING"],
} as const;

export class OrderAdminService {
  constructor(private readonly repository = new OrderAdminRepository()) {}

  async list(storeId: string | null, page: number, limit: number, status?: string) {
    return this.repository.findOrders(storeId, page, limit, status);
  }

  async update(orderId: string, storeId: string | null, input: OrderAdminUpdateInput["body"]) {
    const order = await this.repository.findOrder(orderId, storeId);
    if (!order) throw new NotFoundError("Order not found");
    this.validateTransition(order.status, input.status);
    const result = await this.repository.updateStatus(orderId, storeId, input.status);
    if (!result.count) throw new BadRequestError("Order status could not be updated");
    return this.repository.findOrder(orderId, storeId);
  }

  private validateTransition(current: string, next: keyof typeof TRANSITIONS) {
    if (!TRANSITIONS[next].includes(current as never)) {
      throw new BadRequestError(`Cannot change order from ${current} to ${next}`);
    }
  }
}
