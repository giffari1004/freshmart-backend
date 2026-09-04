import { prisma } from "../../../configs/prisma-client-config";
import { createMeta } from "../../../helper/createMeta";
import { getPagination } from "../../../helper/getPagination";
import { AuthUser } from "../../../middlewares/auth-middleware";
import {
  assertProductValid,
  assertStoreOwnership,
  discountWhere,
  duplicateDiscount,
  existingDiscount,
} from "../discount-helper";
import {
  createDiscountSchema,
  deleteDiscountSchema,
  getDiscountsSchema,
  updateDiscountSchema,
} from "./discount-validation";

export class DiscountService {
  static async create({ body }: createDiscountSchema, user: AuthUser) {
    assertStoreOwnership(user, body.storeId);
    await assertProductValid(body.productId);
    await duplicateDiscount({storeId:body.storeId,productId:body.productId,type:"DIRECT"})
    return prisma.discount.create({
      data: {
        storeId: body.storeId,
        productId: body.productId,
        type: "DIRECT",
        valueType: body.valueType,
        value: body.value,
        startDate: body.startDate,
        endDate: body.endDate,
        createdById: user.id,
      },
    });
  }
  static async update({ params, body }: updateDiscountSchema, user: AuthUser) {
    const existing = await existingDiscount({id:params.id,type:"DIRECT"})
    assertStoreOwnership(user, existing.storeId);
    return prisma.discount.update({
      where: {
        id: params.id,
      },
      data: body,
    });
  }
  static async delete({ params }: deleteDiscountSchema, user: AuthUser) {
    const existing = await existingDiscount({id:params.id,type:"DIRECT"})
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
  static async getAll({ query }: getDiscountsSchema) {
    const { page, limit, storeId, productId, activeOnly } = query;
    const { skip, take } = getPagination(page, limit);
    const where = discountWhere({
      type: "BUY1GET1",
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
    const meta = createMeta(page,limit,totalData)
    return {data,meta}
  }
}
