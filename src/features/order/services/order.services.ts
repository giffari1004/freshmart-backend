import { BadRequestError } from "../../../errors/BadRequestError";
import { NotFoundError } from "../../../errors/NotFoundError";

import { CHECKOUT_MESSAGE } from "../../checkout/constants/checkout.constant";
import { calculateDiscount } from "../../checkout/utils/checkout.voucher.util";

import { OrderMapper } from "../mappers/order.mapper";

import {
  buildOrderItems,
  calculateOrderPrice,
  validateOrderStore,
} from "../helper/order.helper";

import { OrderRepository } from "../repository/order.repository";
import { CreateOrderRequest } from "../order.type";

export class OrderService {
  constructor(
    private readonly orderRepository =
      new OrderRepository(),
  ) {}

  async createOrder(
    userId: string,
    payload: CreateOrderRequest,
  ) {
    const cart =
      await this.orderRepository.getCartForOrder(
        userId,
      );

    if (!cart || cart.items.length === 0) {
      throw new NotFoundError(
        CHECKOUT_MESSAGE.CART_EMPTY,
      );
    }

    const firstItem = cart.items[0];

    if (!firstItem) {
      throw new NotFoundError(
        CHECKOUT_MESSAGE.CART_EMPTY,
      );
    }

    const store =
      firstItem.storeProduct.store;

    if (!store.isActive) {
      throw new BadRequestError(
        CHECKOUT_MESSAGE.STORE_NOT_FOUND,
      );
    }

    validateOrderStore(
      cart.items,
      store.id,
    );

    const address =
      await this.orderRepository.getUserAddress(
        userId,
        payload.addressId,
      );

    if (!address) {
      throw new NotFoundError(
        CHECKOUT_MESSAGE.ADDRESS_NOT_FOUND,
      );
    }

    const shippingMethod =
      await this.orderRepository.getShippingMethod(
        payload.shippingMethodId,
        store.id,
        address.city,
      );

    if (!shippingMethod) {
      throw new NotFoundError(
        CHECKOUT_MESSAGE.SHIPPING_METHOD_INVALID,
      );
    }

    const discount =
      await calculateDiscount(
        this.orderRepository,
        userId,
        payload.userVoucherId,
        cart.items,
      );

    const items = buildOrderItems(
      cart.items,
    );

    const shippingCost =
      Number(shippingMethod.cost);

    const pricing =
      calculateOrderPrice(
        items,
        discount.amount,
        shippingCost,
      );

    const order =
      await this.orderRepository.createOrderTransaction(
        {
          userId,

          storeId: store.id,

          recipientName:
            address.recipientName,

          recipientPhone:
            address.phone,

          province:
            address.province,

          city:
            address.city,

          district:
            address.district,

          fullAddress:
            address.fullAddress,

          shippingMethodId:
            shippingMethod.id,

          subtotal:
            pricing.subtotal,

          discountAmount:
            pricing.discountAmount,

          shippingCost:
            pricing.shippingCost,

          totalAmount:
            pricing.totalAmount,

          userVoucherId:
            payload.userVoucherId,

          items,
        },
      );

    return OrderMapper.toCreateOrderResponse(
      order,
    );
  }
}