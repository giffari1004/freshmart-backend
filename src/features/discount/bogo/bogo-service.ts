import { prisma } from "../../../configs/prisma-client-config";
import { getPagination } from "../../../helper/getPagination";
import { AuthUser } from "../../../middlewares/auth-middleware";
import { assertProductValid, assertStoreOwnership, discountWhere, duplicateDiscount, existingDiscount } from "../discount-helper";
import {
  CalculateBogoSchema,
  CreateBogoSchema,
  DeleteBogoSchema,
  GetAllBogoSchema,
  UpdateBogoSchema,
} from "./bogo-validation";
import { createMeta } from "../../../helper/createMeta";

export class BogoService {
  static async create({ body }: CreateBogoSchema, user: AuthUser) {
    assertStoreOwnership(user, body.storeId);
    await assertProductValid(body.productId);
    await duplicateDiscount({storeId:body.storeId,productId:body.productId,type:"BUY1GET1"})
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
    const existingBogo = await existingDiscount({id:params.id,type:"BUY1GET1"})
    assertStoreOwnership(user, existingBogo.storeId);
    if (body.productId) {
      await assertProductValid(body.productId);
    }
    const updateBogo = await prisma.discount.update({
      where: {
        id: params.id,
      },
      data: body
    });
    return updateBogo;
  }
  static async delete({ params }: DeleteBogoSchema, user: AuthUser) {
    const existingBogo = await existingDiscount({id:params.id,type:"BUY1GET1"})
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
  // ini untuk dipakai feature 3 (said) sebagai logic bogo 
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
    const {page,limit,storeId,productId,activeOnly} = query
    const {skip, take} = getPagination(page,limit)
    const where = discountWhere({type:"BUY1GET1",storeId,productId,activeOnly})
    const [data,totalData] = await Promise.all([
      await prisma.discount.findMany({
        where,
        skip,
        take,
        orderBy: {createdAt:"desc"},
        include: {product:true,store:true}
      }),
      await prisma.discount.count({where})
    ])
  const meta = createMeta(page,limit,totalData)
  return {data,meta}
  }
}
