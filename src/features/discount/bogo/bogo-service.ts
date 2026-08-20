import { prisma } from "../../../configs/prisma-client-config";
import { NotFoundError } from "../../../errors/NotFoundError";
import { AuthUser } from "../../../middlewares/auth-middleware";
import { assertProductValid, assertStoreOwnership } from "../discount-helper";
import {
  CalculateBogoSchema,
  CreateBogoSchema,
  DeleteBogoSchema,
  GetAllBogoSchema,
  UpdateBogoSchema,
} from "./bogo-validation";

export class BogoService {
  static async create({ body }: CreateBogoSchema, user: AuthUser) {
    assertStoreOwnership(user, body.storeId);
    await assertProductValid(body.productId);
    const createBogo = await prisma.discount.create({
      data: {
        storeId: body.storeId,
        productId: body.productId,
        type: "BUY1GET1",
        valueType: "NOMINAL",
        value: 0,
        startDate: body.startDate,
        endDate: body.endDate,
        createdById: user.id,
      },
    });
    return createBogo;
  }
  static async update({ params, body }: UpdateBogoSchema, user: AuthUser) {
    const existingBogo = await prisma.discount.findFirst({
      where: {
        id: params.id,
        type: "BUY1GET1",
        deletedAt: null,
      },
    });
    if (!existingBogo) {
      throw new NotFoundError("BOGO discount not found");
    }
    assertStoreOwnership(user, existingBogo.storeId);
    if (body.productId) {
      await assertProductValid(body.productId);
    }
    const updateBogo = await prisma.discount.update({
      where: {
        id: params.id,
      },
      data: {
        ...(body.productId && {
          productId: body.productId,
        }),
        ...(body.startDate && {
          startDate: body.startDate,
        }),
        ...(body.endDate && {
          endDate: body.endDate,
        }),
      },
    });
    return updateBogo;
  }
  static async delete({ params }: DeleteBogoSchema, user: AuthUser) {
    const existingBogo = await prisma.discount.findFirst({
      where: {
        id: params.id,
        type: "BUY1GET1",
        deletedAt: null,
      },
    });
    if (!existingBogo) {
      throw new NotFoundError("BOGO discount not found");
    }
    assertStoreOwnership(user, existingBogo.storeId);
    const deleteBogo = await prisma.discount.update({
      where: {
        id: params.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    return deleteBogo;
  }

  static async calculate({ body }: CalculateBogoSchema) {
    const now = new Date();
    const bogo = await prisma.discount.findFirst({
      where: {
        storeId: body.storeId,
        productId: body.productId,
        type: "BUY1GET1",
        isActive: true,
        deletedAt: null,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
    });
    if (!bogo) {
      return {
        eligible: false,
        freeQuantity: 0,
      };
    }
    const freeQuantity = Math.floor(body.quantity / 2);
    return {
      eligible: freeQuantity > 0,
      freeQuantity,
      discountId: bogo.id,
      productId: body.productId,
    };
  }
  static async getAll({ query }: GetAllBogoSchema) {
    const bogos = await prisma.discount.findMany({
      where: {
        type: "BUY1GET1",
        deletedAt: null,
        ...(query.storeId && { storeId: query.storeId }),
        ...(query.productId && { productId: query.productId }),
        ...(query.activeOnly && { isActive: true }),
      },
      include: { product: true, store: true },
      orderBy: { createdAt: "desc" },
    });
    return bogos;
  }
}
