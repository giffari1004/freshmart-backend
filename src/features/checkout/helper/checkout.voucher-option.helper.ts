import type { CheckoutOptionVoucher } from "../checkout.types";

interface VoucherRecord {
  id: string;
  voucher: {
    code: string;
    usageType: string;
    valueType: string;
    value: unknown;
    maxDiscountAmount: unknown;
    minPurchaseAmount: unknown;
    expiredAt: Date;
  };
}

export function mapCheckoutVoucher(item: VoucherRecord): CheckoutOptionVoucher {
  return {
    id: item.id,
    code: item.voucher.code,
    usageType: item.voucher.usageType,
    valueType: item.voucher.valueType,
    value: Number(item.voucher.value),
    maxDiscountAmount: toNullableNumber(item.voucher.maxDiscountAmount),
    minPurchaseAmount: toNullableNumber(item.voucher.minPurchaseAmount),
    expiredAt: item.voucher.expiredAt.toISOString(),
  };
}

function toNullableNumber(value: unknown) {
  return value == null ? null : Number(value);
}
