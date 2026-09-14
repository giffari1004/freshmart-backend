import { prisma } from "../../../configs/prisma-client-config";
import { Prisma } from "../../../../generated/prisma";
import { calculateDiscountAmount } from "./checkout.voucher.calculation";

export interface AutomaticDiscountItem {
  productId: string;
  unitPrice: number;
  quantity: number;
}

export interface AutomaticDiscountDetail {
  discountId: string;
  type: "DIRECT" | "MIN_PURCHASE" | "BUY1GET1";
  productId: string | null;
  amount: number;
  freeQuantity: number;
}

type DiscountRecord = Awaited<ReturnType<typeof findActiveDiscounts>>[number];

export function capAutomaticDiscountDetails(
  details: AutomaticDiscountDetail[],
  maxAmount: number,
): AutomaticDiscountDetail[] {
  let remaining = Math.max(0, maxAmount);
  return details.flatMap((detail) => {
    if (remaining <= 0) return [];
    const amount = Math.min(detail.amount, remaining);
    remaining -= amount;
    return [{ ...detail, amount }];
  });
}

export async function calculateAutomaticDiscountDetails(
  storeId: string,
  items: AutomaticDiscountItem[],
  subtotal: number,
): Promise<AutomaticDiscountDetail[]> {
  if (!items.length) return [];
  const discounts = await findActiveDiscounts(storeId, items);
  return [
    ...calculateProductDetails(items, discounts),
    ...calculateMinimumDetail(subtotal, discounts),
  ];
}

async function findActiveDiscounts(
  storeId: string,
  items: AutomaticDiscountItem[],
) {
  return prisma.discount.findMany({
    where: buildDiscountWhere(storeId, items),
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

function buildDiscountWhere(
  storeId: string,
  items: AutomaticDiscountItem[],
): Prisma.DiscountWhereInput {
  const productIds = [...new Set(items.map((item) => item.productId))];
  return {
    storeId,
    deletedAt: null,
    isActive: true,
    startDate: { lte: new Date() },
    endDate: { gte: new Date() },
    OR: [
      { type: "MIN_PURCHASE" },
      { type: { in: ["DIRECT", "BUY1GET1"] }, productId: { in: productIds } },
    ],
  };
}

function calculateProductDetails(
  items: AutomaticDiscountItem[],
  discounts: DiscountRecord[],
) {
  return items.flatMap((item) => calculateProductDetail(item, discounts));
}

function calculateProductDetail(
  item: AutomaticDiscountItem,
  discounts: DiscountRecord[],
): AutomaticDiscountDetail[] {
  const applicable = discounts.filter(
    (discount) => discount.productId === item.productId,
  );
  const bogo = applicable.find((discount) => discount.type === "BUY1GET1");
  const freeQuantity = bogo ? item.quantity : 0;
  if (bogo && freeQuantity > 0) {
    return [
      detail(
        bogo.id,
        "BUY1GET1",
        item.productId,
        freeQuantity * item.unitPrice,
        freeQuantity,
      ),
    ];
  }
  return calculateDirectDetail(item, applicable);
}

function calculateDirectDetail(
  item: AutomaticDiscountItem,
  discounts: DiscountRecord[],
): AutomaticDiscountDetail[] {
  const direct = discounts.find((discount) => discount.type === "DIRECT");
  if (!direct) return [];
  const amount = calculateDiscountAmount(
    item.unitPrice * item.quantity,
    direct.valueType,
    Number(direct.value),
    direct.maxDiscountAmount,
  );
  return amount > 0
    ? [detail(direct.id, "DIRECT", item.productId, amount, 0)]
    : [];
}

function calculateMinimumDetail(
  subtotal: number,
  discounts: DiscountRecord[],
): AutomaticDiscountDetail[] {
  const applicable = discounts.filter(isMinimumApplicable(subtotal));
  const best = findBestMinimumDiscount(applicable, subtotal);
  if (!best) return [];
  return [detail(
    best.id,
    "MIN_PURCHASE",
    best.productId,
    discountAmount(best, subtotal),
    0,
  )];
}

function isMinimumApplicable(subtotal: number) {
  return (discount: DiscountRecord) =>
    discount.type === "MIN_PURCHASE" &&
    discount.minPurchaseAmount !== null &&
    subtotal >= Number(discount.minPurchaseAmount);
}

function findBestMinimumDiscount(
  discounts: DiscountRecord[],
  subtotal: number,
) {
  return discounts.reduce<DiscountRecord | null>((current, discount) => {
    if (!current) return discount;
    return discountAmount(discount, subtotal) > discountAmount(current, subtotal)
      ? discount
      : current;
  }, null);
}

function discountAmount(discount: DiscountRecord, subtotal: number) {
  return calculateDiscountAmount(
    subtotal,
    discount.valueType,
    Number(discount.value),
    discount.maxDiscountAmount,
  );
}

function detail(
  discountId: string,
  type: AutomaticDiscountDetail["type"],
  productId: string | null,
  amount: number,
  freeQuantity: number,
): AutomaticDiscountDetail {
  return { discountId, type, productId, amount, freeQuantity };
}
