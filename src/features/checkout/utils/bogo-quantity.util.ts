import type { AutomaticDiscountDetail } from "./automatic-discount-details.util";

interface QuantityItem {
  productId: string;
  quantity: number;
}

export function applyBogoFreeQuantity<T extends QuantityItem>(
  items: T[],
  automatic: AutomaticDiscountDetail[],
): T[] {
  return items.map((item) => ({
    ...item,
    quantity: item.quantity + getFreeQuantity(item.productId, automatic),
  }));
}

function getFreeQuantity(
  productId: string,
  automatic: AutomaticDiscountDetail[],
) {
  return automatic.find(
    (item) => item.type === "BUY1GET1" && item.productId === productId,
  )?.freeQuantity ?? 0;
}

export function calculatePhysicalWeight<T extends QuantityItem & { unitWeight: number }>(
  items: T[],
  automatic: AutomaticDiscountDetail[],
) {
  const physical = applyBogoFreeQuantity(items, automatic);
  return physical.reduce((total, item) => total + item.unitWeight * item.quantity, 0);
}
