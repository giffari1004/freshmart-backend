import { Prisma } from "../../../../generated/prisma";
import {
  CheckoutItem,
  CheckoutPreviewResponse,
} from "../checkout.types";

type CheckoutCart = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        storeProduct: {
          include: {
            product: {
              include: {
                images: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export class CheckoutMapper {
  static toCheckoutPreview(
    cart: CheckoutCart,
  ): CheckoutPreviewResponse {
    const items: CheckoutItem[] = cart.items.map((item) => {
      const unitPrice = Number(
        item.storeProduct.priceOverride ??
          item.storeProduct.product.basePrice,
      );

      return {
        id: item.id,

        productName: item.storeProduct.product.name,

        imageUrl:
          item.storeProduct.product.images?.[0]?.imageUrl ?? null,

        quantity: item.quantity,

        unitPrice,

        subtotal: unitPrice * item.quantity,

        weight:
          item.storeProduct.product.weight * item.quantity,
      };
    });

    return {
      items,

      totalItems: items.reduce(
        (total, item) => total + item.quantity,
        0,
      ),

      totalWeight: items.reduce(
        (total, item) => total + item.weight,
        0,
      ),

      subtotal: items.reduce(
        (total, item) => total + item.subtotal,
        0,
      ),
    };
  }
}