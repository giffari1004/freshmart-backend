import { BadRequestError } from "../../../errors/BadRequestError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";

export function validateSingleStore(
  items: Array<{
    storeProduct: {
      storeId: string;
    };
  }>,
  storeId: string,
): void {
  const hasMultipleStores =
    items.some(
      (item) =>
        item.storeProduct.storeId !==
        storeId,
    );

  if (hasMultipleStores) {
    throw new BadRequestError(
      CHECKOUT_MESSAGE.CART_MULTIPLE_STORES,
    );
  }
}