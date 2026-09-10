import { prisma } from "../../../configs/prisma-client-config";
import {
  getAllVourcherSchema,
  createVourcherSchema,
  updateVourcherSchema,
  VourcherByIdSchema,
  getVourcherCodeIdSchema,
} from "./voucher-validation";
import {
  assertStoreOwnership,
  checkVoucherCodeDuplicate,
  findVoucherOrError,
  voucherStoreId,
} from "../discount-helper";
import { getPagination } from "../../../helper/getPagination";
import { createMeta } from "../../../helper/createMeta";
import { voucherWhere } from "../discount-helper";
import { NotFoundError } from "../../../errors/NotFoundError";
import { AuthUser } from "../../../middlewares/auth-middleware";

export class VoucherService {
  static async getAllVoucher({ query }: getAllVourcherSchema, user: AuthUser) {
    const { page, limit, search, usageType, storeId,valueType, sortBy, sortOrder } =
      query;
    const { skip, take } = getPagination(page, limit);
    const where = voucherWhere({ user, search, usageType, storeId,valueType });
    const [data, totalData] = await Promise.all([
      prisma.voucher.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          store: {
            select: {
              id: true,
              name: true,
            }
          }
        },
      }),
      prisma.voucher.count({ where }),
    ]);
    const meta = createMeta(page, limit, totalData);
    return { data, meta };
  }
  static async createVoucher({ body }: createVourcherSchema, user: AuthUser) {
    const storeId = voucherStoreId(user,body.storeId)
    await checkVoucherCodeDuplicate(storeId,body.code);
    const voucher = await prisma.voucher.create({
      data: {
        ...body,
        storeId,
        isActive: true,
      },
    });
    return voucher;
  }
  static async updateVoucher({ params, body }: updateVourcherSchema,user:AuthUser) {
    const existingVoucher = await findVoucherOrError(params.id);
    assertStoreOwnership(user,existingVoucher.storeId)
    if (body.code) await checkVoucherCodeDuplicate(existingVoucher.storeId,body.code, params.id);
    const voucher = await prisma.voucher.update({
      where: { id: params.id },
      data: body,
    });
    return voucher;
  }
  static async deleteVoucher({ params }: VourcherByIdSchema, user:AuthUser) {
    const existingVoucher = await findVoucherOrError(params.id);
    assertStoreOwnership(user,existingVoucher.storeId)
    const voucher = await prisma.voucher.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    return voucher;
  }
  static async getVoucherById({ params }: VourcherByIdSchema) {
    return findVoucherOrError(params.id);
  }

  static async validateVoucher({ params }: getVourcherCodeIdSchema) {
    const now = new Date();
    const voucher = await prisma.voucher.findFirst({
      where: {
        code: params.code,
        deletedAt: null,
        isActive: true,
        expiredAt: { gte: now },
      },
    });
    if (!voucher) {
      throw new NotFoundError("Voucher is invalid or expired");
    }
    return voucher;
  }
}
