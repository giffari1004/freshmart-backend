import { prisma } from "../../../configs/prisma-client-config";
import { AuthUser } from "../../../middlewares/auth-middleware";

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