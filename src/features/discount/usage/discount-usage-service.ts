import { Prisma } from "../../../../generated/prisma";
import { prisma } from "../../../configs/prisma-client-config";
import { getAllUsageSchema } from "./discount-usage-validation";
import { createMeta, getPagination, resolveStoreFilter } from "./discount-usage-helper";
import { AuthUser } from "../../../middlewares/auth-middleware";

export class DiscountUsageService {
  static async getAllUsage({ query }: getAllUsageSchema, user: AuthUser) {
    const { page, limit, storeId, startDate, endDate, sortBy, sortOrder } = query;
    const { skip, take } = getPagination(page, limit);
    const resolvedStoreId = resolveStoreFilter(user, storeId);
    const where: Prisma.DiscountUsageWhereInput = {
      ...(resolvedStoreId && { discount: { storeId: resolvedStoreId } }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    };
    const [usages, totalData] = await Promise.all([
      prisma.discountUsage.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: { discount: true, user: true, order: true },
      }),
      prisma.discountUsage.count({ where }),
    ]);
    const meta = createMeta(page, limit, totalData);
    return { usages, meta };
  }
}