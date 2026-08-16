import { prisma } from "../../configs/prisma-client-config";
import { NotFoundError } from "../../errors/NotFoundError";
import { AuthUser } from "../../middlewares/auth-middleware";
import {
  assertProductValid,
  assertStoreOwnership,
} from "../discount/discount-helper";
import {
  createMinimumDiscountSchema,
  updateMinimumDiscountSchema,
  deleteMinimumDiscountSchema,
} from "./minimum-discount-validation";

export class MinimumPurchaseDiscountService {
  static async create(
    { body }: createMinimumDiscountSchema,
    user: AuthUser,
  ) {
    assertStoreOwnership(user, body.storeId);

    if (body.productId) {
      await assertProductValid(body.productId);
    }

    return prisma.discount.create({
      data: {
        storeId: body.storeId,
        ...(body.productId && {
          productId: body.productId,
        }),
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
    const existing = await prisma.discount.findFirst({
      where: {
        id: params.id,
        type: "MIN_PURCHASE",
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

  static async delete(
    { params }: deleteMinimumDiscountSchema,
    user: AuthUser,
  ) {
    const existing = await prisma.discount.findFirst({
      where: {
        id: params.id,
        type: "MIN_PURCHASE",
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
}