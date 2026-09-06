import { prisma } from "../../configs/prisma-client-config";
import { Forbidden } from "../../errors/Forbidden";
import { NotFoundError } from "../../errors/NotFoundError";
import { AuthUser } from "../../middlewares/auth-middleware";
import { Prisma } from "../../../generated/prisma";
import {
  DiscountDuplicateProps,
  DiscountFilterProps,
  ExistingDiscountProps,
  VourcherFilterProps,
} from "./discount-constant";
import { ConflictError } from "../../errors/ConflictError";

export function assertStoreOwnership(user: AuthUser, storeId: string) {
  if (user.role === "STORE_ADMIN" && storeId !== user.storeId) {
    throw new Forbidden("Access denied, not your store");
  }
}

export async function assertProductValid(productId: string) {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });
  if (!product || product.deletedAt) {
    throw new NotFoundError("Product is not found");
  }
}

export function voucherWhere({
  search,
  usageType,
  valueType,
  isActive,
}: VourcherFilterProps): Prisma.VoucherWhereInput {
  return {
    deletedAt: null,
    ...(search && { code: { contains: search, mode: "insensitive" } }),
    ...(usageType && { usageType }),
    ...(valueType && { valueType }),
    ...(isActive !== undefined && { isActive }),
  };
}

export function discountWhere({
  type,
  storeId,
  productId,
  activeOnly,
}: DiscountFilterProps): Prisma.DiscountWhereInput {
  const now = new Date();
  return {
    type,
    deletedAt: null,
    ...(storeId && { storeId }),
    ...(productId && { productId }),
    ...(activeOnly && {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    }),
  };
}

export async function duplicateDiscount({
  storeId,
  productId,
  type,
}: DiscountDuplicateProps) {
  const duplicate = await prisma.discount.findFirst({
    where: {
      storeId,
      productId,
      type,
      deletedAt: null,
    },
  });
  if (duplicate)
    throw new ConflictError(
      `${type} discount for this product and store already exists`,
    );
}

export async function existingDiscount({ id, type }: ExistingDiscountProps) {
  const existing = await prisma.discount.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });
  if (!existing) {
    throw new NotFoundError(`Discount ${type} not found`);
  }
  return existing;
}

export async function findVoucherOrError(id: string) {
  const existingVoucher = await prisma.voucher.findUnique({
    where: { id,deletedAt:null },
  });
  if (!existingVoucher) throw new NotFoundError("Voucher not found");
  return existingVoucher;
}
export async function checkVoucherCodeDuplicate(
  code: string,
  excludeId?: string,
) {
  const existingVoucher = await prisma.voucher.findFirst({
    where: { code , deletedAt:null},
  });
  if (existingVoucher && existingVoucher.id !== excludeId) {
    throw new ConflictError("Voucher code already exists");
  }
}
