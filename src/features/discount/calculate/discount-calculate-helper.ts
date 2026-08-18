import { prisma } from "../../../configs/prisma-client-config";

type CartItem = { productId: string; quantity: number; price: number };
type DiscountResult = {
  productId: string;
  discountType: "DIRECT" | "MIN_PURCHASE" | "BUY1GET1";
  discountAmount: number;
};
export function isWithinPeriod(startDate: Date, endDate: Date) {
  const now = new Date();
  return now >= startDate && now <= endDate;
}
export function calculateCartTotal(cartItems: CartItem[]) {
  return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
export async function getDirectDiscount(storeId: string, item: CartItem) {
  const discount = await prisma.discount.findFirst({
    where: {
      storeId,
      productId: item.productId,
      type: "DIRECT",
      isActive: true,
      deletedAt: null,
    },
  });
  if (!discount) return null;
  if (!isWithinPeriod(discount.startDate, discount.endDate)) return null;
  const value = Number(discount.value);
  const amount =
    discount.valueType === "PERCENTAGE"
      ? (value / 100) * item.price * item.quantity
      : value * item.quantity;
  const result: DiscountResult = {
    productId: item.productId,
    discountType: "DIRECT",
    discountAmount: amount,
  };
  return result;
}
export async function getBuy1Get1Discount(storeId: string, item: CartItem) {
  const discount = await prisma.discount.findFirst({
    where: {
      storeId,
      productId: item.productId,
      type: "BUY1GET1",
      isActive: true,
      deletedAt: null,
    },
  });
  if (!discount) return null;
  if (!isWithinPeriod(discount.startDate, discount.endDate)) return null;
  if (item.quantity < 2) return null;
  const freeQty = Math.floor(item.quantity / 2);
  const amount = freeQty * item.price;
  const result: DiscountResult = {
    productId: item.productId,
    discountType: "BUY1GET1",
    discountAmount: amount,
  };
  return result;
}
export async function getMinPurchaseDiscount(storeId: string, totalAmount: number) {
  const discount = await prisma.discount.findFirst({
    where: {
      storeId,
      type: "MIN_PURCHASE",
      isActive: true,
      deletedAt: null,
      minPurchaseAmount: { lte: totalAmount },
    },
    orderBy: { minPurchaseAmount: "desc" },
  });
  if (!discount) return null;
  if (!isWithinPeriod(discount.startDate, discount.endDate)) return null;
  const value = Number(discount.value);
  let amount = discount.valueType === "PERCENTAGE" ? (value / 100) * totalAmount : value;
  if (discount.maxDiscountAmount) {
    amount = Math.min(amount, Number(discount.maxDiscountAmount));
  }
  const result: DiscountResult = {
    productId: "CART",
    discountType: "MIN_PURCHASE",
    discountAmount: amount,
  };
  return result;
}
export async function getPerItemDiscounts(storeId: string, cartItems: CartItem[]) {
  const discounts: DiscountResult[] = [];
  for (const item of cartItems) {
    const direct = await getDirectDiscount(storeId, item);
    if (direct) discounts.push(direct);

    const bogo = await getBuy1Get1Discount(storeId, item);
    if (bogo) discounts.push(bogo);
  }
  return discounts;
}