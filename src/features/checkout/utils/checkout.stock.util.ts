import { BadRequestError } from "../../../errors/BadRequestError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";

interface StockItem {
  quantity: number;
  storeProduct: { stockQuantity: number; reservedStock: number };
}

export function validateCheckoutStock(items: StockItem[]): void {
  if (items.some(hasInsufficientStock))
    throw new BadRequestError(CHECKOUT_MESSAGE.STOCK_NOT_AVAILABLE);
}

function hasInsufficientStock(item: StockItem): boolean {
  return (
    item.storeProduct.stockQuantity - item.storeProduct.reservedStock <
    item.quantity
  );
}
