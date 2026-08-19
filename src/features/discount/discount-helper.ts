import { prisma } from "../../configs/prisma-client-config";
import { Forbidden } from "../../errors/Forbidden";
import { NotFoundError } from "../../errors/NotFoundError";
import { AuthUser } from "../../middlewares/auth-middleware";

export function assertStoreOwnership(
  user: AuthUser,
  storeId: string,
) {
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

export function getPagination(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function createMeta(page: number, limit: number, totalData: number) {
  return {
    page,
    limit,
    totalData,
    totalPages: Math.ceil(totalData / limit),
  };
}