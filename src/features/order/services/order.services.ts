import { NotFoundError } from "../../../errors/NotFoundError";
import { CHECKOUT_MESSAGE } from "../../checkout/constants/checkout.constant";
import { CheckoutStoreSelectionService } from "../../checkout/services/checkout.store-selection.service";
import { calculateDiscount } from "../../checkout/utils/checkout.voucher.util";
import { OrderMapper } from "../mappers/order.mapper";
import {
  validateCancellationStatus,
  validateConfirmationStatus,
} from "../helper/order.cancellation.helper";
import { buildOrderItems } from "../helper/order.helper";
import { buildOrderTransactionData } from "../helper/order.transaction-data.helper";
import { OrderRepository } from "../repository/order.repository";
import type { CreateOrderRequest, OrderListQuery } from "../order.type";

type OrderCart = NonNullable<
  Awaited<ReturnType<OrderRepository["getCartForOrder"]>>
>;
type OrderAddress = NonNullable<
  Awaited<ReturnType<OrderRepository["getUserAddress"]>>
>;
type StoreSelection = Awaited<
  ReturnType<CheckoutStoreSelectionService["selectStore"]>
>;

export class OrderService {
  constructor(
    private readonly orderRepository = new OrderRepository(),
    private readonly storeSelectionService = new CheckoutStoreSelectionService(),
  ) {}

  async getOrders(userId: string, query: OrderListQuery) {
    const result = await this.orderRepository.getOrdersByUser(userId, query);
    return {
      items: result.orders.map(OrderMapper.toOrderListItem),
      pagination: {
        page: result.page,
        limit: result.limit,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / result.limit),
      },
    };
  }

  async getOrderDetail(orderId: string, userId: string) {
    const detail = await this.orderRepository.getOrderDetail(orderId, userId);
    if (!detail) throw new NotFoundError("Order not found");
    return OrderMapper.toOrderDetail(detail);
  }

  async cancelOrder(orderId: string, userId: string) {
    const detail = await this.orderRepository.getOrderForCancellation(orderId, userId);
    if (!detail) throw new NotFoundError("Order not found");
    validateCancellationStatus(detail.status);
    return this.orderRepository.cancelOrder(orderId, userId);
  }

  async confirmOrder(orderId: string, userId: string) {
    const order = await this.orderRepository.getOrderForConfirmation(orderId, userId);
    if (!order) throw new NotFoundError("Order not found");
    validateConfirmationStatus(order.status);
    return this.orderRepository.confirmOrder(orderId, userId);
  }

  async createOrder(userId: string, payload: CreateOrderRequest) {
    const context = await this.buildOrderContext(userId, payload);
    const order = await this.orderRepository.createOrderTransaction(context);
    return OrderMapper.toCreateOrderResponse(order);
  }

  private async buildOrderContext(
    userId: string,
    payload: CreateOrderRequest,
  ) {
    const cart = await this.getCart(userId);
    const address = await this.getAddress(userId, payload.addressId);
    const selection = await this.selectStore(cart, address);
    const selectedCart = this.applyStoreSelection(cart, selection);
    return this.buildOrderData(userId, payload, address, selection, selectedCart);
  }

  private async buildOrderData(
    userId: string,
    payload: CreateOrderRequest,
    address: OrderAddress,
    selection: StoreSelection,
    cart: OrderCart,
  ) {
    const shipping = await this.getShipping(
      payload.shippingMethodId, selection.store.id, address.city,
    );
    const discount = await this.getDiscount(userId, payload, cart);
    const items = buildOrderItems(cart.items);
    return buildOrderTransactionData(
      userId, payload, selection.store, address, shipping, items, discount.amount,
    );
  }

  private async getCart(userId: string) {
    const cart = await this.orderRepository.getCartForOrder(userId);
    if (!cart?.items.length) {
      throw new NotFoundError(CHECKOUT_MESSAGE.CART_EMPTY);
    }
    return cart;
  }

  private async getAddress(userId: string, addressId: string) {
    const address = await this.orderRepository.getUserAddress(userId, addressId);
    if (!address) {
      throw new NotFoundError(CHECKOUT_MESSAGE.ADDRESS_NOT_FOUND);
    }
    return address;
  }

  private async selectStore(
    cart: OrderCart,
    address: OrderAddress,
  ): Promise<StoreSelection> {
    const items = cart.items.map(toRequestedStoreItem);
    return this.storeSelectionService.selectStore(
      items, address.latitude, address.longitude,
    );
  }

  private applyStoreSelection(
    cart: OrderCart,
    selection: StoreSelection,
  ): OrderCart {
    const selected = new Map(
      selection.storeProducts.map((item) => [item.productId, item]),
    );
    const items = cart.items.map((item) => ({
      ...item,
      storeProduct:
        selected.get(item.storeProduct.productId) ?? item.storeProduct,
    }));
    return { ...cart, items };
  }

  private async getShipping(
    shippingMethodId: string,
    storeId: string,
    city: string,
  ) {
    const shipping = await this.orderRepository.getShippingMethod(
      shippingMethodId, storeId, city,
    );
    if (!shipping) {
      throw new NotFoundError(CHECKOUT_MESSAGE.SHIPPING_METHOD_INVALID);
    }
    return shipping;
  }

  private getDiscount(
    userId: string,
    payload: CreateOrderRequest,
    cart: OrderCart,
  ) {
    return calculateDiscount(
      this.orderRepository, userId, payload.userVoucherId, cart.items,
    );
  }
}

function toRequestedStoreItem(item: OrderCart["items"][number]) {
  return {
    productId: item.storeProduct.productId,
    quantity: item.quantity,
  };
}
