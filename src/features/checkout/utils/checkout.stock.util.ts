import { BadRequestError } from "../../../errors/BadRequestError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";

interface StockItem {
  quantity: number;

  storeProduct: {
    stockQuantity: number;
    reservedStock: number;
  };
}

export function validateCheckoutStock(
  items: StockItem[],
): void {
  const hasInsufficientStock =
    items.some((item) => {
      const availableStock =
        item.storeProduct.stockQuantity -
        item.storeProduct.reservedStock;

      return (
        availableStock <
        item.quantity
      );
    });

  if (hasInsufficientStock) {
    throw new BadRequestError(
      CHECKOUT_MESSAGE.STOCK_NOT_AVAILABLE,
    );
  }
}