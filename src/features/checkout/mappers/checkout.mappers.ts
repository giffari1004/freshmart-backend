import { Prisma } from "../../../../generated/prisma";

import {
  CheckoutAddress,
  CheckoutDiscount,
  CheckoutItem,
  CheckoutPreviewResponse,
  CheckoutShipping,
  CheckoutStore,
} from "../checkout.types";

type CheckoutCart = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        storeProduct: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    },
  },
}>;

interface CheckoutPreviewData {
  address: CheckoutAddress;
  store: CheckoutStore;
  shipping: CheckoutShipping;
  discount: CheckoutDiscount;
}

export class CheckoutMapper {
  static toCheckoutPreview(
    cart: CheckoutCart,
    data: CheckoutPreviewData,
  ): CheckoutPreviewResponse {
    const items: CheckoutItem[] =
      cart.items.map((item) => {
        const unitPrice = Number(
          item.storeProduct.priceOverride ??
            item.storeProduct.product.basePrice,
        );

        const subtotal =
          unitPrice * item.quantity;

        const weight =
          item.storeProduct.product.weight *
          item.quantity;

        return {
          id: item.id,
          storeProductId:
            item.storeProductId,
          productId:
            item.storeProduct.productId,

          productName:
            item.storeProduct.product.name,

          imageUrl:
            item.storeProduct.product.images?.[0]
              ?.imageUrl ?? null,

          quantity: item.quantity,

          unitPrice,

          subtotal,

          weight,
        };
      });

    const totalItems =
      items.reduce(
        (total, item) =>
          total + item.quantity,
        0,
      );

    const totalWeight =
      items.reduce(
        (total, item) =>
          total + item.weight,
        0,
      );

    const subtotal =
      items.reduce(
        (total, item) =>
          total + item.subtotal,
        0,
      );

    const totalAmount =
      subtotal -
      data.discount.amount +
      data.shipping.cost;

    return {
      items,
      totalItems,
      totalWeight,
      subtotal,
      discount: data.discount,
      shipping: data.shipping,
      totalAmount,
      address: data.address,
      store: data.store,
    };
  }
}