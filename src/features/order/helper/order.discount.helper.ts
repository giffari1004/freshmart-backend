import { calculateDiscount } from "../../checkout/utils/checkout.voucher.util";
import { calculateVoucherSubtotal } from "../../checkout/utils/checkout.voucher.calculation";
import {
  AutomaticDiscountItem,
  calculateAutomaticDiscountDetails,
  capAutomaticDiscountDetails,
} from "../../checkout/utils/automatic-discount-details.util";
import { OrderItemCalculation, calculateOrderSubtotal } from "./order.helper";
import type { OrderRepository } from "../repository/order.repository";
import { OrderDiscountUsage, toDiscountUsages } from "./order.discount-usage.helper";

export interface OrderDiscountResult {
  items: OrderItemCalculation[];
  amount: number;
  voucherAmount: number;
  usages: OrderDiscountUsage[];
}

export async function calculateOrderDiscount(
  repository: Pick<OrderRepository, "getUserVoucher">,
  userId: string,
  userVoucherId: string | undefined,
  storeId: string,
  items: OrderItemCalculation[],
  shippingCost: number,
): Promise<OrderDiscountResult> {
  const voucher = await calculateDiscount(
    repository,
    userId,
    userVoucherId,
    toVoucherItems(items),
    shippingCost,
  );
  const automatic = await calculateAutomaticDiscountDetails(
    storeId,
    items.map(toAutomaticItem),
    calculateOrderSubtotal(items),
  );
  const maxAutomatic =
    calculateOrderSubtotal(items) + shippingCost - voucher.amount;
  const appliedAutomatic = capAutomaticDiscountDetails(automatic, maxAutomatic);
  const usages = toDiscountUsages(appliedAutomatic);
  const amount = voucher.amount + usages.reduce((sum, item) => sum + item.amountDeducted, 0);
  return { items, amount, voucherAmount: voucher.amount, usages };
}

function toAutomaticItem(item: OrderItemCalculation): AutomaticDiscountItem {
  return {
    productId: item.productId,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
  };
}

function toVoucherItems(items: OrderItemCalculation[]) {
  return items.map((item) => ({
    quantity: item.quantity,
    storeProduct: {
      priceOverride: item.unitPrice,
      product: { id: item.productId, basePrice: item.unitPrice },
    },
  }));
}
