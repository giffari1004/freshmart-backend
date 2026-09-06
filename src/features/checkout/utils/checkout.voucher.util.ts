import { BadRequestError } from "../../../errors/BadRequestError";
import { NotFoundError } from "../../../errors/NotFoundError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";
import { CheckoutDiscount } from "../checkout.types";
import {
  calculateDiscountAmount,
  calculateVoucherSubtotal,
} from "./checkout.voucher.calculation";
import {
  validateMinimumPurchase,
  validateVoucherUsage,
} from "./checkout.voucher.validation";

interface VoucherItem {
  quantity: number;
  storeProduct: {
    priceOverride: unknown;
    product: { id: string; basePrice: unknown };
  };
}

interface UserVoucherWithVoucher {
  id: string;
  isUsed: boolean;
  voucher: {
    code: string;
    usageType: string;
    valueType: string;
    value: unknown;
    maxDiscountAmount: unknown;
    minPurchaseAmount: unknown;
    productId: string | null;
    expiredAt: Date;
    isActive: boolean;
  };
}

interface VoucherRepository {
  getUserVoucher(
    userId: string,
    userVoucherId: string,
  ): Promise<UserVoucherWithVoucher | null>;
}

export async function calculateDiscount(
  repository: VoucherRepository,
  userId: string,
  userVoucherId: string | undefined,
  items: VoucherItem[],
): Promise<CheckoutDiscount> {
  if (!userVoucherId) return emptyDiscount();
  const userVoucher = await repository.getUserVoucher(userId, userVoucherId);
  validateUserVoucher(userVoucher);
  const voucher = userVoucher!.voucher;
  const subtotal = calculateVoucherSubtotal(items);
  validateVoucher(voucher, subtotal, items);
  return buildDiscount(userVoucher!, voucher, subtotal);
}

function emptyDiscount(): CheckoutDiscount {
  return { userVoucherId: null, voucherCode: null, amount: 0 };
}

function validateUserVoucher(userVoucher: UserVoucherWithVoucher | null): void {
  if (!userVoucher) throw new NotFoundError(CHECKOUT_MESSAGE.VOUCHER_NOT_FOUND);
  if (userVoucher.isUsed)
    throw new BadRequestError(CHECKOUT_MESSAGE.VOUCHER_ALREADY_USED);
}

function validateVoucher(
  voucher: UserVoucherWithVoucher["voucher"],
  subtotal: number,
  items: VoucherItem[],
): void {
  if (!voucher.isActive)
    throw new BadRequestError(CHECKOUT_MESSAGE.VOUCHER_NOT_ACTIVE);
  if (voucher.expiredAt <= new Date())
    throw new BadRequestError(CHECKOUT_MESSAGE.VOUCHER_EXPIRED);
  validateVoucherUsage(voucher.usageType, voucher.productId, items);
  validateMinimumPurchase(subtotal, voucher.minPurchaseAmount);
}

function buildDiscount(
  userVoucher: UserVoucherWithVoucher,
  voucher: UserVoucherWithVoucher["voucher"],
  subtotal: number,
): CheckoutDiscount {
  const amount =
    voucher.usageType === "SHIPPING"
      ? 0
      : calculateDiscountAmount(
          subtotal,
          voucher.valueType,
          voucher.value,
          voucher.maxDiscountAmount,
        );
  return { userVoucherId: userVoucher.id, voucherCode: voucher.code, amount };
}
