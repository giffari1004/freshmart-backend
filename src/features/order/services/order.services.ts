import { BadRequestError } from "../../../errors/BadRequestError";
import { NotFoundError } from "../../../errors/NotFoundError";
import { CHECKOUT_MESSAGE } from "../../checkout/constants/checkout.constant";
import { calculateDiscount } from "../../checkout/utils/checkout.voucher.util";
import { OrderMapper } from "../mappers/order.mapper";
import {
  buildOrderItems,
  calculateOrderPrice,
  validateOrderStore,
  OrderItemCalculation,
} from "../helper/order.helper";
import { OrderRepository } from "../repository/order.repository";
import { CreateOrderRequest } from "../order.type";

type OrderCart = NonNullable<
  Awaited<ReturnType<OrderRepository["getCartForOrder"]>>
>;
type OrderStore = OrderCart["items"][number]["storeProduct"]["store"];
type OrderAddress = NonNullable<
  Awaited<ReturnType<OrderRepository["getUserAddress"]>>
>;
type OrderShipping = NonNullable<
  Awaited<ReturnType<OrderRepository["getShippingMethod"]>>
>;
type OrderPricing = ReturnType<typeof calculateOrderPrice>;

export class OrderService {
  constructor(private readonly orderRepository = new OrderRepository()) {}

  async createOrder(userId: string, payload: CreateOrderRequest) {
    const cart = await this.getCart(userId);
    const store = this.getStore(cart);
    const address = await this.getAddress(userId, payload.addressId);
    const shipping = await this.getShipping(
      payload.shippingMethodId,
      store.id,
      address.city,
    );
    const discount = await calculateDiscount(
      this.orderRepository,
      userId,
      payload.userVoucherId,
      cart.items,
    );
    const items = buildOrderItems(cart.items);
    const pricing = calculateOrderPrice(
      items,
      discount.amount,
      Number(shipping.cost),
    );
    const order = await this.orderRepository.createOrderTransaction(
      this.buildTransactionData(
        userId,
        payload,
        store,
        address,
        shipping,
        pricing,
        items,
      ),
    );
    return OrderMapper.toCreateOrderResponse(order);
  }

  private async getCart(userId: string) {
    const cart = await this.orderRepository.getCartForOrder(userId);
    if (!cart?.items.length)
      throw new NotFoundError(CHECKOUT_MESSAGE.CART_EMPTY);
    return cart;
  }

  private getStore(cart: OrderCart): OrderStore {
    const firstItem = cart.items[0];
    if (!firstItem || !firstItem.storeProduct.store.isActive)
      throw new BadRequestError(CHECKOUT_MESSAGE.STORE_NOT_FOUND);
    validateOrderStore(cart.items, firstItem.storeProduct.store.id);
    return firstItem.storeProduct.store;
  }

  private async getAddress(userId: string, addressId: string) {
    const address = await this.orderRepository.getUserAddress(
      userId,
      addressId,
    );
    if (!address) throw new NotFoundError(CHECKOUT_MESSAGE.ADDRESS_NOT_FOUND);
    return address;
  }

  private async getShipping(
    shippingMethodId: string,
    storeId: string,
    city: string,
  ) {
    const shipping = await this.orderRepository.getShippingMethod(
      shippingMethodId,
      storeId,
      city,
    );
    if (!shipping)
      throw new NotFoundError(CHECKOUT_MESSAGE.SHIPPING_METHOD_INVALID);
    return shipping;
  }

  private buildTransactionData(
    userId: string,
    payload: CreateOrderRequest,
    store: OrderStore,
    address: OrderAddress,
    shipping: OrderShipping,
    pricing: OrderPricing,
    items: OrderItemCalculation[],
  ) {
    return {
      userId,
      storeId: store.id,
      recipientName: address.recipientName,
      recipientPhone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      fullAddress: address.fullAddress,
      shippingMethodId: shipping.id,
      subtotal: pricing.subtotal,
      discountAmount: pricing.discountAmount,
      shippingCost: pricing.shippingCost,
      totalAmount: pricing.totalAmount,
      userVoucherId: payload.userVoucherId,
      items,
    };
  }
}
