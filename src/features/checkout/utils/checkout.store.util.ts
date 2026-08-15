import { BadRequestError } from "../../../errors/BadRequestError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";

interface StoreItem {
  storeProduct: { storeId: string };
}

export function validateSingleStore(items: StoreItem[], storeId: string): void {
  if (items.some((item) => item.storeProduct.storeId !== storeId))
    throw new BadRequestError(CHECKOUT_MESSAGE.CART_MULTIPLE_STORES);
}
