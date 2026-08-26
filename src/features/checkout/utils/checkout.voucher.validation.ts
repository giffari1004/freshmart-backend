import { BadRequestError } from "../../../errors/BadRequestError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";

interface VoucherItem {
  storeProduct: { product: { id: string } };
}

export function validateVoucherUsage(
  usageType: string,
  productId: string | null,
  items: VoucherItem[],
): void {
  if (usageType === "CART_TOTAL" || usageType === "SHIPPING") return;
  if (usageType !== "PRODUCT_SPECIFIC" || !productId) {
    throw new BadRequestError(CHECKOUT_MESSAGE.VOUCHER_NOT_APPLICABLE);
  }
  const found = items.some(
    (item) => item.storeProduct.product.id === productId,
  );
  if (!found)
    throw new BadRequestError(CHECKOUT_MESSAGE.VOUCHER_NOT_APPLICABLE);
}

export function validateMinimumPurchase(
  subtotal: number,
  minimum: unknown,
): void {
  if (minimum !== null && subtotal < Number(minimum)) {
    throw new BadRequestError(CHECKOUT_MESSAGE.VOUCHER_MINIMUM_NOT_MET);
  }
}
