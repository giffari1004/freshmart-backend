import { BadRequestError } from "../../../errors/BadRequestError";
import { CHECKOUT_MESSAGE } from "../../checkout/constants/checkout.constant";

interface OrderCartItem {
  storeProduct: {
    id: string;
    storeId: string;
    productId: string;
    priceOverride: unknown;
    product: { name: string; basePrice: unknown };
  };
  quantity: number;
}
export interface OrderItemCalculation {
  storeProductId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}
interface OrderPriceCalculation {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
}

export function validateOrderStore(
  items: OrderCartItem[],
  storeId: string,
): void {
  if (items.some((item) => item.storeProduct.storeId !== storeId))
    throw new BadRequestError(CHECKOUT_MESSAGE.CART_MULTIPLE_STORES);
}

export function buildOrderItems(
  items: OrderCartItem[],
): OrderItemCalculation[] {
  return items.map(toOrderItem);
}

function toOrderItem(item: OrderCartItem): OrderItemCalculation {
  const unitPrice = Number(
    item.storeProduct.priceOverride ?? item.storeProduct.product.basePrice,
  );
  return {
    storeProductId: item.storeProduct.id,
    productId: item.storeProduct.productId,
    productName: item.storeProduct.product.name,
    unitPrice,
    quantity: item.quantity,
    subtotal: unitPrice * item.quantity,
  };
}

export function calculateOrderSubtotal(items: OrderItemCalculation[]): number {
  return items.reduce((total, item) => total + item.subtotal, 0);
}

export function calculateOrderTotal(
  subtotal: number,
  discountAmount: number,
  shippingCost: number,
): number {
  return subtotal - discountAmount + shippingCost;
}

export function calculateOrderPrice(
  items: OrderItemCalculation[],
  discountAmount: number,
  shippingCost: number,
): OrderPriceCalculation {
  const subtotal = calculateOrderSubtotal(items);
  return {
    subtotal,
    discountAmount,
    shippingCost,
    totalAmount: calculateOrderTotal(subtotal, discountAmount, shippingCost),
  };
}
