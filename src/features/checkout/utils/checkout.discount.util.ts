import { CheckoutPreviewRequest, CheckoutDiscount } from "../checkout.types";
import { CheckoutRepository } from "../repository/checkout.repository";
import { calculateDiscount } from "./checkout.voucher.util";
import { calculateVoucherSubtotal } from "./checkout.voucher.calculation";
import {
  AutomaticDiscountItem,
  calculateAutomaticDiscountDetails,
  capAutomaticDiscountDetails,
} from "./automatic-discount-details.util";

export type CheckoutCart = NonNullable<
  Awaited<ReturnType<CheckoutRepository["getCheckoutPreview"]>>
>;

export async function calculateCheckoutDiscount(
  repository: CheckoutRepository,
  userId: string,
  payload: CheckoutPreviewRequest,
  cart: CheckoutCart,
  shippingCost: number,
): Promise<CheckoutDiscount> {
  const voucher = await calculateDiscount(
    repository,
    userId,
    payload.userVoucherId,
    cart.items,
    shippingCost,
  );
  const firstItem = cart.items[0];
  if (!firstItem) return voucher;
  const automatic = await calculateAutomaticDiscountDetails(
    firstItem.storeProduct.storeId,
    cart.items.map(toAutomaticDiscountItem),
    calculateVoucherSubtotal(cart.items),
  );
  const maxAutomatic = calculateVoucherSubtotal(cart.items) + shippingCost - voucher.amount;
  const appliedAutomatic = capAutomaticDiscountDetails(automatic, maxAutomatic);
  return {
    ...voucher,
    automatic: appliedAutomatic,
    amount: voucher.amount + sumAutomatic(appliedAutomatic),
    voucherAmount: voucher.amount,
  };
}

function sumAutomatic(automatic: Awaited<ReturnType<typeof calculateAutomaticDiscountDetails>>) {
  return automatic.reduce((total, item) => total + item.amount, 0);
}

function toAutomaticDiscountItem(
  item: CheckoutCart["items"][number],
): AutomaticDiscountItem {
  return {
    productId: item.storeProduct.productId,
    unitPrice: Number(
      item.storeProduct.priceOverride ?? item.storeProduct.product.basePrice,
    ),
    quantity: item.quantity,
  };
}
