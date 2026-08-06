import {
  createStoreAdminSchema,
  deleteStoreAdminSchema,
  getAllUserSchema,
  updateStoreAdminSchema,
} from "./admin-validation";
import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { ConflictError } from "../../errors/ConflictError";
import { BcryptUtil } from "../../utils/bcrypt-util";
import { NotFoundError } from "../../errors/NotFoundError";
export class AdminService {
  static async getAllUser({ query }: getAllUserSchema) {
    const { page, limit, search, role, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;
    const take = limit;
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),
      ...(role && { role }),
    };
    const [users, totalData] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          storeId: true,
          isVerified: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);
    return {
      users,
      meta: {
        page,
        limit,
        totalData,
        totalPages: Math.ceil(totalData / limit),
      },
    };
  }
  static async create({ body }: createStoreAdminSchema) {
    const existingEmail = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });
    if (existingEmail)
      throw new ConflictError(
        "Account is not valid , Pleease check you email or password again",
      );
    const hashedPassword = await BcryptUtil.hashPassword(body.password);
    const createAcc = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash: hashedPassword,
        storeId: body.storeId,
        role: "STORE_ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        storeId: true,
        role: true,
      },
    });
    return createAcc;
  }
  static async update({ params, body }: updateStoreAdminSchema) {
    const existingUser = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
    });
    if (!existingUser || existingUser.role !== "STORE_ADMIN")
      throw new NotFoundError("Account is not found");
    const updateAcc = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: {
        name: body.name,
        storeId: body.storeId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        storeId: true,
        role: true,
      },
    });
    return updateAcc;
  }
  static async delete({ params }: deleteStoreAdminSchema) {
    const existingUser = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
    });
    if (!existingUser || existingUser.role !== "STORE_ADMIN" || existingUser.deletedAt)
      throw new NotFoundError("Account is not found");
    const deleteAcc = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: {
        deletedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        deletedAt: true,
      },
    });
    return deleteAcc;
  }
}
