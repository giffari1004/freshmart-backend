import { OrderActionRepository } from "./order.action.repository";
import { OrderQueryRepository } from "./order.query.repository";
import { CreateOrderTransactionData } from "../order.transaction";
import type { OrderListQuery } from "../order.type";

export class OrderRepository {
  constructor(
    private readonly queryRepository = new OrderQueryRepository(),
    private readonly actionRepository = new OrderActionRepository(),
  ) {}

  getCartForOrder(userId: string) {
    return this.queryRepository.getCartForOrder(userId);
  }

  getUserAddress(userId: string, addressId: string) {
    return this.queryRepository.getUserAddress(userId, addressId);
  }

  getShippingMethod(
    shippingMethodId: string,
    storeId: string,
    destinationCity: string,
  ) {
    return this.queryRepository.getShippingMethod(
      shippingMethodId,
      storeId,
      destinationCity,
    );
  }

  getUserVoucher(userId: string, userVoucherId: string) {
    return this.queryRepository.getUserVoucher(userId, userVoucherId);
  }

  getOrdersByUser(userId: string, query: OrderListQuery) {
    return this.queryRepository.getOrdersByUser(userId, query);
  }

  getOrderForCancellation(orderId: string, userId: string) {
    return this.queryRepository.getOrderForCancellation(orderId, userId);
  }

  cancelOrder(orderId: string, userId: string) {
    return this.actionRepository.cancelOrder(orderId, userId);
  }

  getOrderForConfirmation(orderId: string, userId: string) {
    return this.queryRepository.getOrderForConfirmation(orderId, userId);
  }

  confirmOrder(orderId: string, userId: string) {
    return this.actionRepository.confirmOrder(orderId, userId);
  }

  getOrderDetail(orderId: string, userId: string) {
    return this.queryRepository.getOrderDetail(orderId, userId);
  }

  createOrderTransaction(data: CreateOrderTransactionData) {
    return this.actionRepository.createOrderTransaction(data);
  }
}
