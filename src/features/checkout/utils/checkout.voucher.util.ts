import { BadRequestError } from "../../../errors/BadRequestError";
import { NotFoundError } from "../../../errors/NotFoundError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";
import { CheckoutDiscount } from "../checkout.types";

interface VoucherItem {
  quantity: number;

  storeProduct: {
    priceOverride: unknown;

    product: {
      id: string;
      basePrice: unknown;
    };
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
  if (!userVoucherId) {
    return {
      userVoucherId: null,
      voucherCode: null,
      amount: 0,
    };
  }

  const userVoucher =
    await repository.getUserVoucher(
      userId,
      userVoucherId,
    );

  if (!userVoucher) {
    throw new NotFoundError(
      CHECKOUT_MESSAGE.VOUCHER_NOT_FOUND,
    );
  }

  if (userVoucher.isUsed) {
    throw new BadRequestError(
      CHECKOUT_MESSAGE.VOUCHER_ALREADY_USED,
    );
  }

  const voucher = userVoucher.voucher;

  if (!voucher.isActive) {
    throw new BadRequestError(
      CHECKOUT_MESSAGE.VOUCHER_NOT_ACTIVE,
    );
  }

  if (voucher.expiredAt <= new Date()) {
    throw new BadRequestError(
      CHECKOUT_MESSAGE.VOUCHER_EXPIRED,
    );
  }

  const subtotal = calculateSubtotal(items);

  validateVoucherUsage(
    voucher.usageType,
    voucher.productId,
    items,
  );

  validateMinimumPurchase(
    subtotal,
    voucher.minPurchaseAmount,
  );

  /*
   * Shipping voucher tidak mengurangi subtotal.
   * Logic shipping voucher akan ditangani
   * pada kalkulasi shipping.
   */
  if (voucher.usageType === "SHIPPING") {
    return {
      userVoucherId: userVoucher.id,
      voucherCode: voucher.code,
      amount: 0,
    };
  }

  const amount = calculateDiscountAmount(
    subtotal,
    voucher.valueType,
    voucher.value,
    voucher.maxDiscountAmount,
  );

  return {
    userVoucherId: userVoucher.id,
    voucherCode: voucher.code,
    amount,
  };
}

function calculateSubtotal(
  items: VoucherItem[],
): number {
  return items.reduce(
    (total, item) => {
      const unitPrice = Number(
        item.storeProduct.priceOverride ??
          item.storeProduct.product.basePrice,
      );

      return (
        total +
        unitPrice * item.quantity
      );
    },
    0,
  );
}

function validateVoucherUsage(
  usageType: string,
  productId: string | null,
  items: VoucherItem[],
): void {
  if (usageType === "CART_TOTAL") {
    return;
  }

  if (usageType === "PRODUCT_SPECIFIC") {
    if (!productId) {
      throw new BadRequestError(
        CHECKOUT_MESSAGE.VOUCHER_NOT_APPLICABLE,
      );
    }

    const containsProduct = items.some(
      (item) =>
        item.storeProduct.product.id ===
        productId,
    );

    if (!containsProduct) {
      throw new BadRequestError(
        CHECKOUT_MESSAGE.VOUCHER_NOT_APPLICABLE,
      );
    }

    return;
  }

  if (usageType === "SHIPPING") {
    return;
  }
}

function validateMinimumPurchase(
  subtotal: number,
  minPurchaseAmount: unknown,
): void {
  if (
    minPurchaseAmount !== null &&
    subtotal <
      Number(minPurchaseAmount)
  ) {
    throw new BadRequestError(
      CHECKOUT_MESSAGE.VOUCHER_MINIMUM_NOT_MET,
    );
  }
}

function calculateDiscountAmount(
  subtotal: number,
  valueType: string,
  value: unknown,
  maxDiscountAmount: unknown,
): number {
  let discountAmount: number;

  if (valueType === "PERCENTAGE") {
    discountAmount =
      subtotal *
      (Number(value) / 100);
  } else {
    discountAmount = Number(value);
  }

  if (maxDiscountAmount !== null) {
    discountAmount = Math.min(
      discountAmount,
      Number(maxDiscountAmount),
    );
  }

  discountAmount = Math.min(
    discountAmount,
    subtotal,
  );

  return Number(
    discountAmount.toFixed(2),
  );
}