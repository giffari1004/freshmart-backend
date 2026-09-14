import {
  applyBogoBonus,
  calculateAutomaticDiscount,
  AutomaticDiscountItem,
} from "../../discount/discount-calculation";
import {
  OrderItemCalculation,
  calculateOrderSubtotal,
} from "./order.helper";

export interface OrderDiscountResult {
  items: OrderItemCalculation[];
  amount: number;
}

export async function calculateOrderDiscount(
  storeId: string,
  items: OrderItemCalculation[],
  voucherAmount: number,
  shippingCost: number,
): Promise<OrderDiscountResult> {
  const discountItems = items.map(toDiscountItem);
  const subtotal = calculateOrderSubtotal(items);

  const automatic = await calculateAutomaticDiscount(
    storeId,
    discountItems,
    subtotal,
  );

  const bonusItems = await applyBogoBonus(
    storeId,
    discountItems,
  );

  const finalItems = applyBonusQuantities(
    items,
    bonusItems,
  );

  return {
    items: finalItems,
    amount: capDiscount(
      voucherAmount + automatic,
      finalItems,
      shippingCost,
    ),
  };
}

function toDiscountItem(
  item: OrderItemCalculation,
): AutomaticDiscountItem {
  return {
    productId: item.productId,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
  };
}

function applyBonusQuantities(
  items: OrderItemCalculation[],
  bonusItems: AutomaticDiscountItem[],
) {
  const quantities = new Map(
    bonusItems.map((item) => [
      item.productId,
      item.quantity,
    ]),
  );

  return items.map((item) => {
    const quantity =
      quantities.get(item.productId) ??
      item.quantity;

    return {
      ...item,
      quantity,
      subtotal: item.unitPrice * quantity,
    };
  });
}

function capDiscount(
  amount: number,
  items: OrderItemCalculation[],
  shippingCost: number,
) {
  return Math.min(
    amount,
    calculateOrderSubtotal(items) + shippingCost,
  );
}