import { prisma } from "../../configs/prisma-client-config";
import { calculateVoucherSubtotal } from "../checkout/utils/checkout.voucher.calculation";
import {
  AutomaticDiscountDetail,
  AutomaticDiscountItem,
  calculateAutomaticDiscountDetails,
} from "../checkout/utils/automatic-discount-details.util";

export interface CartVoucherResponse {
  id: string;
  code: string;
  usageType: string;
  valueType: string;
  value: number;
  minPurchaseAmount: number | null;
  expiredAt: string;
}

export interface CartPromotionResponse {
  storeId: string;
  promotions: AutomaticDiscountDetail[];
  vouchers: CartVoucherResponse[];
  totalAmount: number;
}

type CartPromotionItem = {
  quantity: number;
  storeProduct: {
    productId: string;
    priceOverride: unknown;
    product: { basePrice: unknown };
  };
};

export async function getCartPromotions(
  userId: string,
  storeId: string | null,
  items: CartPromotionItem[],
): Promise<CartPromotionResponse> {
  const vouchers = await getAvailableVouchers(userId, storeId);
  if (!storeId || !items.length) return emptyPromotions(storeId, vouchers);
  const discountItems = items.map(toDiscountItem);
  const subtotal = calculateVoucherSubtotal(items);
  const promotions = await calculateAutomaticDiscountDetails(
    storeId,
    discountItems,
    subtotal,
  );
  return { storeId, promotions, vouchers, totalAmount: sum(promotions) };
}

async function getAvailableVouchers(
  userId: string,
  storeId: string | null,
): Promise<CartVoucherResponse[]> {
  const records = await prisma.userVoucher.findMany({
    where: {
      userId,
      isUsed: false,
      voucher: {
        isActive: true,
        expiredAt: { gt: new Date() },
        storeId: storeId ?? undefined,
      },
    },
    include: { voucher: true },
    orderBy: { id: "desc" },
  });
  return records.map(({ id, voucher }) => ({
    id,
    code: voucher.code,
    usageType: voucher.usageType,
    valueType: voucher.valueType,
    value: Number(voucher.value),
    minPurchaseAmount: voucher.minPurchaseAmount == null
      ? null
      : Number(voucher.minPurchaseAmount),
    expiredAt: voucher.expiredAt.toISOString(),
  }));
}

function toDiscountItem(
  item: CartPromotionItem,
): AutomaticDiscountItem {
  return {
    productId: item.storeProduct.productId,
    unitPrice: Number(
      item.storeProduct.priceOverride ?? item.storeProduct.product.basePrice,
    ),
    quantity: item.quantity,
  };
}

function emptyPromotions(
  storeId: string | null,
  vouchers: CartVoucherResponse[],
): CartPromotionResponse {
  return {
    storeId: storeId ?? "",
    promotions: [],
    vouchers,
    totalAmount: 0,
  };
}

function sum(promotions: AutomaticDiscountDetail[]) {
  return promotions.reduce((total, item) => total + item.amount, 0);
}
