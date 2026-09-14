import type { AutomaticDiscountDetail } from "../../checkout/utils/automatic-discount-details.util";

export interface OrderDiscountUsage {
  discountId: string;
  amountDeducted: number;
}

export function toDiscountUsages(
  details: AutomaticDiscountDetail[],
): OrderDiscountUsage[] {
  return details
    .filter((detail) => detail.amount > 0)
    .map((detail) => ({
      discountId: detail.discountId,
      amountDeducted: detail.amount,
    }));
}
