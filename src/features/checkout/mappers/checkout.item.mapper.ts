import { CheckoutItem } from "../checkout.types";

export interface CheckoutCartItem {
  id: string;
  storeProductId: string;
  quantity: number;
  storeProduct: {
    productId: string;
    priceOverride: unknown;
    product: {
      name: string;
      basePrice: unknown;
      weight: number;
      images?: { imageUrl: string }[];
    };
  };
}

export function toCheckoutItem(item: CheckoutCartItem): CheckoutItem {
  const unitPrice = Number(
    item.storeProduct.priceOverride ?? item.storeProduct.product.basePrice,
  );
  return {
    id: item.id,
    storeProductId: item.storeProductId,
    productId: item.storeProduct.productId,
    productName: item.storeProduct.product.name,
    imageUrl: item.storeProduct.product.images?.[0]?.imageUrl ?? null,
    quantity: item.quantity,
    unitPrice,
    subtotal: unitPrice * item.quantity,
    weight: item.storeProduct.product.weight * item.quantity,
  };
}
