import { calculateAutomaticDiscountDetails } from "./automatic-discount-details.util";
import { calculatePhysicalWeight } from "./bogo-quantity.util";

interface CartWeightItem {
  storeProduct: {
    productId: string;
    priceOverride: unknown;
    product: { basePrice: unknown; weight: number };
  };
  quantity: number;
}

export async function getPhysicalCartWeight(
  cart: { items: CartWeightItem[] },
  storeId: string,
) {
  const items = cart.items.map(toWeightItem);
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const automatic = await calculateAutomaticDiscountDetails(storeId, items, subtotal);
  return calculatePhysicalWeight(items, automatic);
}

function toWeightItem(item: CartWeightItem) {
  return {
    productId: item.storeProduct.productId,
    unitPrice: Number(item.storeProduct.priceOverride ?? item.storeProduct.product.basePrice),
    quantity: item.quantity,
    unitWeight: item.storeProduct.product.weight,
  };
}
