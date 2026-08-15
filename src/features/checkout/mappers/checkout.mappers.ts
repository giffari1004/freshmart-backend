import { Prisma } from "../../../../generated/prisma";
import {
  CheckoutAddress,
  CheckoutDiscount,
  CheckoutItem,
  CheckoutPreviewResponse,
  CheckoutShipping,
  CheckoutStore,
} from "../checkout.types";
import { toCheckoutItem } from "./checkout.item.mapper";

type CheckoutCart = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        storeProduct: { include: { product: { include: { images: true } } } };
      };
    };
  };
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
    const items = cart.items.map(toCheckoutItem);
    const totalItems = sum(items, "quantity");
    const totalWeight = sum(items, "weight");
    const subtotal = sum(items, "subtotal");
    return {
      items,
      totalItems,
      totalWeight,
      subtotal,
      discount: data.discount,
      shipping: data.shipping,
      totalAmount: subtotal - data.discount.amount + data.shipping.cost,
      address: data.address,
      store: data.store,
    };
  }
}

function sum(
  items: CheckoutItem[],
  key: "quantity" | "weight" | "subtotal",
): number {
  return items.reduce((total, item) => total + item[key], 0);
}
