import { Prisma } from "../../../../generated/prisma";
import { prisma } from "../../../configs/prisma-client-config";
import { getAllUsageSchema } from "./discount-usage-validation";
import { resolveStoreFilter } from "./discount-usage-helper";
import { AuthUser } from "../../../middlewares/auth-middleware";
import { getPagination } from "../../../helper/getPagination";
import { createMeta } from "../../../helper/createMeta";

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
    const [data , totalData] = await Promise.all([
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
    return { data , meta };
  }
}