import { Prisma } from "../../../../generated/prisma";
import { prisma } from "../../../configs/prisma-client-config";
import {
  getAllVourcherSchema,
  createVourcherSchema,
  updateVourcherSchema,
  VourcherByIdSchema,
} from "./voucher-validation";
import {
  checkVoucherCodeDuplicate,
  findVoucherOrError,
} from "./voucher-helper";
import { getPagination } from "../../../helper/getPagination";
import { createMeta } from "../../../helper/createMeta";
import { voucherWhere } from "../discount-helper";

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
    const where = voucherWhere({search,usageType,valueType,isActive})
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
      data: { isActive: false },
    });
    return voucher;
  }
  static async getVoucherById({ params }: VourcherByIdSchema) {
    return findVoucherOrError(params.id);
  }
}
