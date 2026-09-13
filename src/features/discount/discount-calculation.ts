import { prisma } from "../../configs/prisma-client-config";
import { calculateDiscountAmount } from "../checkout/utils/checkout.voucher.calculation";

export interface AutomaticDiscountItem {
  productId: string;
  unitPrice: number;
  quantity: number;
}

type DiscountRecord = Awaited<ReturnType<typeof findActiveDiscounts>>[number];


export async function applyBogoBonus(
  storeId: string,
  items: AutomaticDiscountItem[],
): Promise<AutomaticDiscountItem[]> {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const discounts = await prisma.discount.findMany({
    where: {
      storeId,
      deletedAt: null,
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
      type: "BUY1GET1",
      productId: { in: productIds },
    },
    select: { productId: true },
  });
  const bogoProducts = new Set(
    discounts.map((discount) => discount.productId),
  );
  return items.map((item) =>
    bogoProducts.has(item.productId) && item.quantity === 1
      ? { ...item, quantity: 2 }
      : item,
  );
}

export async function calculateAutomaticDiscount(
  storeId: string,
  items: AutomaticDiscountItem[],
  subtotal: number,
): Promise<number> {
  if (!items.length) return 0;
  const discounts = await findActiveDiscounts(storeId, items);
  const productDiscount = calculateProductDiscount(items, discounts);
  const minimumDiscount = calculateMinimumDiscount(subtotal, discounts);
  return productDiscount + minimumDiscount;
}

async function findActiveDiscounts(
  storeId: string,
  items: AutomaticDiscountItem[],
) {
  const productIds = [...new Set(items.map((item) => item.productId))];
  return prisma.discount.findMany({
    where: {
      storeId,
      deletedAt: null,
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
      OR: [
        { type: "MIN_PURCHASE" },
        { type: { in: ["DIRECT", "BUY1GET1"] }, productId: { in: productIds } },
      ],
    },
    select: {
      id: true,
      productId: true,
      type: true,
      valueType: true,
      value: true,
      minPurchaseAmount: true,
      maxDiscountAmount: true,
    },
  });
}

function calculateProductDiscount(
  items: AutomaticDiscountItem[],
  discounts: DiscountRecord[],
): number {
  return items.reduce((total, item) => {
    const applicable = discounts.filter((discount) => discount.productId === item.productId);
    const bogo = getBogoDiscount(item, applicable);
    return total + (bogo > 0 ? bogo : getDirectDiscount(item, applicable));
  }, 0);
}

function getDirectDiscount(
  item: AutomaticDiscountItem,
  discounts: DiscountRecord[],
): number {
  const discount = discounts.find((itemDiscount) => itemDiscount.type === "DIRECT");
  if (!discount) return 0;
  return calculateDiscountAmount(
    item.unitPrice * item.quantity,
    discount.valueType,
    Number(discount.value),
    discount.maxDiscountAmount,
  );
}

function getBogoDiscount(
  item: AutomaticDiscountItem,
  discounts: DiscountRecord[],
): number {
  const discount = discounts.find((itemDiscount) => itemDiscount.type === "BUY1GET1");
  if (!discount) return 0;
  return item.quantity === 1 ? item.unitPrice : 0;
}

function calculateMinimumDiscount(
  subtotal: number,
  discounts: DiscountRecord[],
): number {
  const applicable = discounts.filter(
    (discount) =>
      discount.type === "MIN_PURCHASE" &&
      discount.minPurchaseAmount !== null &&
      subtotal >= Number(discount.minPurchaseAmount),
  );
  return applicable.reduce((best, discount) => {
    const amount = calculateDiscountAmount(
      subtotal,
      discount.valueType,
      Number(discount.value),
      discount.maxDiscountAmount,
    );
    return Math.max(best, amount);
  }, 0);
}
