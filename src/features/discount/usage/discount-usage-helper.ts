import { prisma } from "../../../configs/prisma-client-config";
import { AuthUser } from "../../../middlewares/auth-middleware";

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
export function resolveStoreFilter(user: AuthUser, storeId?: string) {
  if (user.role === "SUPER_ADMIN") return storeId;
  return user.storeId ?? undefined;
}
export async function recordDiscountUsage(params: {
  discountId: string;
  userId: string;
  orderId: string;
  amountDeducted: number;
  userVoucherId?: string;
}) {
  const usage = await prisma.discountUsage.create({
    data: {
      discountId: params.discountId,
      userId: params.userId,
      orderId: params.orderId,
      amountDeducted: params.amountDeducted,
      userVoucherId: params.userVoucherId ?? null,
    },
  });
  return usage;
}