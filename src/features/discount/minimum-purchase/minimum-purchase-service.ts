import { prisma } from "../../../configs/prisma-client-config";
import { NotFoundError } from "../../../errors/NotFoundError";
import { createMeta } from "../../../helper/createMeta";
import { getPagination } from "../../../helper/getPagination";
import { AuthUser } from "../../../middlewares/auth-middleware";
import {
  assertProductValid,
  assertStoreOwnership,
  discountWhere,
  existingDiscount,
} from "../discount-helper";
import {
  createMinimumDiscountSchema,
  updateMinimumDiscountSchema,
  deleteMinimumDiscountSchema,
  getMinimumPurchaseSchema,
} from "./minimum-purchase-validation";

export class MinimumPurchaseDiscountService {
  static async create({ body }: createMinimumDiscountSchema, user: AuthUser) {
    assertStoreOwnership(user, body.storeId);
    return prisma.discount.create({
      data: {
        storeId: body.storeId,
        type: "MIN_PURCHASE",
        valueType: body.valueType,
        value: body.value,
        minPurchaseAmount: body.minPurchaseAmount,
        maxDiscountAmount: body.maxDiscountAmount,
        startDate: body.startDate,
        endDate: body.endDate,
        createdById: user.id,
      },
    });
  }

  static async update(
    { params, body }: updateMinimumDiscountSchema,
    user: AuthUser,
  ) {
    const existing = await existingDiscount({
      id: params.id,
      type: "MIN_PURCHASE",
    });
    assertStoreOwnership(user, existing.storeId);
    return prisma.discount.update({
      where: {
        id: params.id,
      },
      data: body,
    });
  }

  static async delete({ params }: deleteMinimumDiscountSchema, user: AuthUser) {
    const existing = await existingDiscount({
      id: params.id,
      type: "MIN_PURCHASE",
    });
    assertStoreOwnership(user, existing.storeId);
    return prisma.discount.update({
      where: {
        id: params.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  static async getAll({ query }: getMinimumPurchaseSchema) {
    const { page, limit, storeId, productId, activeOnly } = query;
    const { skip, take } = getPagination(page, limit);
    const where = discountWhere({
      type: "MIN_PURCHASE",
      storeId,
      productId,
      activeOnly,
    });
    const [data, totalData] = await Promise.all([
      await prisma.discount.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { product: true, store: true },
      }),
      await prisma.discount.count({ where }),
    ]);
    const meta = createMeta(page, limit, totalData);
    return { data, meta };
  }
}
