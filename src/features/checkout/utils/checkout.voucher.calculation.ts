interface VoucherItem {
  quantity: number;
  storeProduct: { priceOverride: unknown; product: { basePrice: unknown } };
}

export function calculateVoucherSubtotal(items: VoucherItem[]): number {
  return items.reduce(
    (total, item) => total + getUnitPrice(item) * item.quantity,
    0,
  );
}

function getUnitPrice(item: VoucherItem): number {
  return Number(
    item.storeProduct.priceOverride ?? item.storeProduct.product.basePrice,
  );
}

export function calculateDiscountAmount(
  subtotal: number,
  valueType: string,
  value: unknown,
  maxDiscountAmount: unknown,
): number {
  const raw =
    valueType === "PERCENTAGE"
      ? subtotal * (Number(value) / 100)
      : Number(value);
  const capped =
    maxDiscountAmount === null ? raw : Math.min(raw, Number(maxDiscountAmount));
  return Number(Math.min(capped, subtotal).toFixed(2));
}
