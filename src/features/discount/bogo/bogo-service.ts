import { prisma } from "../../../configs/prisma-client-config";
import { getPagination } from "../../../helper/getPagination";
import { AuthUser } from "../../../middlewares/auth-middleware";
import { assertProductValid, assertStoreOwnership, discountWhere, duplicateDiscount, existingDiscount, voucherStoreId } from "../discount-helper";
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
    const storeId = voucherStoreId(user,body.storeId)
    assertStoreOwnership(user, storeId);
    await assertProductValid(body.productId);
    await duplicateDiscount({storeId,productId:body.productId,type:"BUY1GET1"})
    const createBogo = await prisma.discount.create({
      data: {
        storeId,
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
  static async getAll({ query }: GetAllBogoSchema,user:AuthUser) {
    const {page,limit,storeId,productId} = query
    const {skip, take} = getPagination(page,limit)
    const where = discountWhere({user,type:"BUY1GET1",storeId,productId})
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
