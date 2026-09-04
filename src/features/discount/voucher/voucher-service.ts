import { prisma } from "../../../configs/prisma-client-config";
import {
  getAllVourcherSchema,
  createVourcherSchema,
  updateVourcherSchema,
  VourcherByIdSchema,
  getVourcherCodeIdSchema,
} from "./voucher-validation";
import {
  checkVoucherCodeDuplicate,
  findVoucherOrError,
} from "../discount-helper";
import { getPagination } from "../../../helper/getPagination";
import { createMeta } from "../../../helper/createMeta";
import { voucherWhere } from "../discount-helper";
import { NotFoundError } from "../../../errors/NotFoundError";

export class VoucherService {
  static async getAllVoucher({ query }: getAllVourcherSchema) {
    const {
      page,
      limit,
      search,
      usageType,
      valueType,
      isActive,
      sortBy,
      sortOrder,
    } = query;
    const { skip, take } = getPagination(page, limit);
    const where = voucherWhere({ search, usageType, valueType, isActive });
    const [data, totalData] = await Promise.all([
      prisma.voucher.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.voucher.count({ where }),
    ]);
    const meta = createMeta(page, limit, totalData);
    return { data, meta };
  }
  static async createVoucher({ body }: createVourcherSchema) {
    await checkVoucherCodeDuplicate(body.code);
    const voucher = await prisma.voucher.create({ data: body });
    return voucher;
  }
  static async updateVoucher({ params, body }: updateVourcherSchema) {
    await findVoucherOrError(params.id);
    if (body.code) await checkVoucherCodeDuplicate(body.code, params.id);
    const voucher = await prisma.voucher.update({
      where: { id: params.id },
      data: body,
    });
    return voucher;
  }
  static async deleteVoucher({ params }: VourcherByIdSchema) {
    await findVoucherOrError(params.id);
    const voucher = await prisma.voucher.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    return voucher;
  }
  static async getVoucherById({ params }: VourcherByIdSchema) {
    return findVoucherOrError(params.id);
  }

  static async validateVoucher({params}:getVourcherCodeIdSchema) {
    const now = new Date();
    const voucher = await prisma.voucher.findFirst({
      where: {
        code:params.code,
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
