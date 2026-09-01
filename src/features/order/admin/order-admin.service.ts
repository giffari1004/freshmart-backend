import { OrderAdminRepository } from "./order-admin.repository";
import {
  OrderAdminListInput,
  AdminOrderStatus,
} from "./order-admin.type";

export class OrderAdminService {
  constructor(
    private readonly orderAdminRepository = new OrderAdminRepository(),
  ) {}

  async getOrders(
    query: OrderAdminListInput["query"],
    storeId: string | null,
  ) {
    return this.orderAdminRepository.getOrders(query, storeId);
  }

  async updateStatus(
    orderId: string,
    status: AdminOrderStatus,
    actorId: string,
    storeId: string | null,
  ) {
    return this.orderAdminRepository.updateStatus(
      orderId,
      status,
      actorId,
      storeId,
    );
  }
}