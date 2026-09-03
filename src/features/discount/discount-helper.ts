import { prisma } from "../../configs/prisma-client-config";
import { Forbidden } from "../../errors/Forbidden";
import { NotFoundError } from "../../errors/NotFoundError";
import { AuthUser } from "../../middlewares/auth-middleware";
import { Prisma } from "../../../generated/prisma";
import { DiscountFilterProps, VourcherFilterProps } from "./discount-constant";

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
}: VourcherFilterProps ): Prisma.VoucherWhereInput {
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
