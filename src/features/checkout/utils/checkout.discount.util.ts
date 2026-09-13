import { CheckoutPreviewRequest } from "../checkout.types";
import { CheckoutRepository } from "../repository/checkout.repository";
import { calculateDiscount } from "./checkout.voucher.util";
import { calculateVoucherSubtotal } from "./checkout.voucher.calculation";
import {
  applyBogoBonus,
  calculateAutomaticDiscount,
} from "../../discount/discount-calculation";

export type CheckoutCart = NonNullable<
  Awaited<ReturnType<CheckoutRepository["getCheckoutPreview"]>>
>;

export async function calculateCheckoutDiscount(
  repository: CheckoutRepository,
  userId: string,
  payload: CheckoutPreviewRequest,
  cart: CheckoutCart,
  shippingCost: number,
) {
  const voucher = await calculateDiscount(
    repository,
    userId,
    payload.userVoucherId,
    cart.items,
    shippingCost,
  );
  const firstItem = cart.items[0];
  if (!firstItem) return voucher;
  const automatic = await calculateAutomaticDiscount(
    firstItem.storeProduct.storeId,
    cart.items.map(toAutomaticDiscountItem),
    calculateVoucherSubtotal(cart.items),
  );
  return {
    ...voucher,
    amount: calculateTotalDiscount(
      voucher.amount,
      automatic,
      calculateVoucherSubtotal(cart.items),
      shippingCost,
    ),
  };
}

export async function applyCheckoutBogoBonus(cart: CheckoutCart) {
  const firstItem = cart.items[0];
  if (!firstItem) return cart;
  const items = await applyBogoBonus(
    firstItem.storeProduct.storeId,
    cart.items.map(toAutomaticDiscountItem),
  );
  const quantities = new Map(items.map((item) => [item.productId, item.quantity]));
  return {
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      quantity: quantities.get(item.storeProduct.productId) ?? item.quantity,
    })),
  };
}

function calculateTotalDiscount(
  voucherAmount: number,
  automaticAmount: number,
  subtotal: number,
  shippingCost: number,
) {
  return Math.min(voucherAmount + automaticAmount, subtotal + shippingCost);
}

function toAutomaticDiscountItem(item: CheckoutCart["items"][number]) {
  return {
    productId: item.storeProduct.productId,
    unitPrice: Number(
      item.storeProduct.priceOverride ?? item.storeProduct.product.basePrice,
    ),
    quantity: item.quantity,
  };
}
