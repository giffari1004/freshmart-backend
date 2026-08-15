import { prisma } from "../../configs/prisma-client-config";
import { ConflictError } from "../../errors/ConflictError";
import { NotFoundError } from "../../errors/NotFoundError";
import { AuthUser } from "../../middlewares/auth-middleware";
import { assertProductValid, assertStoreOwnership } from "./discount-helper";
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

    const existing = await prisma.discount.findFirst({
      where: {
        storeId: body.storeId,
        productId: body.productId,
        type: "DIRECT",
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictError(
        "Discount for this product and store already exists",
      );
    }

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
    const existing = await prisma.discount.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundError("Discount not found");
    }
    assertStoreOwnership(user, existing.storeId);
    return prisma.discount.update({
      where: {
        id: params.id,
      },
      data: body,
    });
  }
  static async delete({ params }: deleteDiscountSchema, user: AuthUser) {
    const existing = await prisma.discount.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundError("Discount not found");
    }
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
    const now = new Date();
    return prisma.discount.findMany({
      where: {
        deletedAt: null,
        type: "DIRECT",
        ...(query.storeId && {
          storeId: query.storeId,
        }),

        ...(query.productId && {
          productId: query.productId,
        }),

        ...(query.activeOnly && {
          isActive: true,
          startDate: {
            lte: now,
          },
          endDate: {
            gte: now,
          },
        }),
      },
      orderBy: {
        createdAt: "desc",
      },

      include: {
        product: true,
        store: true,
      },
    });
  }
}
