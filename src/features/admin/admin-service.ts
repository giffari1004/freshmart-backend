import {
  createStoreAdminSchema,
  deleteStoreAdminSchema,
  getAllUserSchema,
  updateStoreAdminSchema,
} from "./admin-validation";
import { prisma } from "../../configs/prisma-client-config";
import { BcryptUtil } from "../../utils/bcrypt-util";
import { getPagination } from "../../helper/getPagination";
import {
  checkDuplicateEmail,
  findStoreAdminOrError,
  whereUser,
} from "./admin-helper";
import { createMeta } from "../../helper/createMeta";
import {
  ADMIN_DELETE_SELECT,
  ADMIN_GET_SELECT,
  ADMIN_UPDATE_CREATE_SELECT,
} from "./admin-constant";
export class AdminService {
  static async getAllUser({ query }: getAllUserSchema) {
    const { page, limit, search, role, sortBy, sortOrder } = query;
    const { skip, take } = getPagination(page, limit);
    const where = whereUser(search, role);
    const [users, totalData] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: ADMIN_GET_SELECT,
      }),
      prisma.user.count({ where }),
    ]);
    const meta = createMeta(page, limit, totalData);
    return { users, meta };
  }
  static async create({ body }: createStoreAdminSchema) {
    await checkDuplicateEmail(body.email);
    const hashedPassword = await BcryptUtil.hashPassword(body.password);
    const createAcc = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash: hashedPassword,
        storeId: body.storeId,
        role: "STORE_ADMIN",
      },
      select: ADMIN_UPDATE_CREATE_SELECT,
    });
    return createAcc;
  }
  static async update({ params, body }: updateStoreAdminSchema) {
    await findStoreAdminOrError(params.id);
    const updateAcc = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: {
        name: body.name,
        storeId: body.storeId,
      },
      select: ADMIN_UPDATE_CREATE_SELECT,
    });
    return updateAcc;
  }
  static async delete({ params }: deleteStoreAdminSchema) {
    await findStoreAdminOrError(params.id);
    const deleteAcc = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: {
        deletedAt: new Date(),
      },
      select: ADMIN_DELETE_SELECT,
    });
    return deleteAcc;
  }
}
