import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { ConflictError } from "../../errors/ConflictError";
import { NotFoundError } from "../../errors/NotFoundError";
import { BadRequestError } from "../../errors/BadRequestError";
import type {
  createStoreSchema,
  updateStoreSchema,
  getAllStoreSchema,
  getStoreByIdSchema,
  deleteStoreSchema,
  assignStoreAdminSchema,
} from "./store.validation";

export class StoreService {
  static async getAll({ query }: getAllStoreSchema) {
    const { page, limit, search, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.StoreWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status && { isActive: status === "active" }),
    };

    const [stores, totalData] = await Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          storeAdmins: {
            where: { deletedAt: null },
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      }),
      prisma.store.count({ where }),
    ]);

    return {
      stores,
      meta: {
        page,
        limit,
        totalData,
        totalPages: Math.ceil(totalData / limit),
      },
    };
  }

  static async getById({ params }: getStoreByIdSchema) {
    const store = await prisma.store.findUnique({
      where: { id: params.id },
      include: {
        storeAdmins: {
          where: { deletedAt: null },
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
    if (!store || store.deletedAt) throw new NotFoundError("Store not found");
    return store;
  }

  static async create({ body }: createStoreSchema) {
    const existingCode = await prisma.store.findUnique({
      where: { code: body.code },
    });
    if (existingCode) throw new ConflictError("Store code is already in use");

    return prisma.store.create({ data: { ...body } });
  }

  static async update({ params, body }: updateStoreSchema) {
    const existingStore = await prisma.store.findUnique({
      where: { id: params.id },
    });
    if (!existingStore || existingStore.deletedAt) {
      throw new NotFoundError("Store not found");
    }

    if (body.code && body.code !== existingStore.code) {
      const existingCode = await prisma.store.findUnique({
        where: { code: body.code },
      });
      if (existingCode) {
        throw new ConflictError("Store code is already in use");
      }
    }

    return prisma.store.update({
      where: { id: params.id },
      data: { ...body },
    });
  }

  static async delete({ params }: deleteStoreSchema) {
    const existingStore = await prisma.store.findUnique({
      where: { id: params.id },
      include: { _count: { select: { storeAdmins: true } } },
    });
    if (!existingStore || existingStore.deletedAt) {
      throw new NotFoundError("Store not found");
    }

    // Guard bisnis: jangan biarkan toko terhapus sementara masih ada store
    // admin yang nempel — bisa bikin data admin "menggantung" tanpa toko
    // yang valid untuk dia kelola.
    if (existingStore._count.storeAdmins > 0) {
      throw new ConflictError(
        "Cannot delete a store that still has store admin(s) assigned. Reassign them first.",
      );
    }

    return prisma.store.update({
      where: { id: params.id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  /**
   * "Assign Store Admin" — bagian eksplisit dari requirement Store
   * Management (Feature 1), sengaja dipisah dari CRUD akun store admin
   * (Feature 2, `features/admin`). Endpoint ini jadi satu-satunya jalur
   * resmi untuk mengubah `storeId` milik seorang store admin.
   */
  static async assignAdmin({ params, body }: assignStoreAdminSchema) {
    const store = await prisma.store.findUnique({ where: { id: params.id } });
    if (!store || store.deletedAt) throw new NotFoundError("Store not found");

    const user = await prisma.user.findUnique({
      where: { id: body.userId },
    });
    if (!user || user.deletedAt) throw new NotFoundError("User not found");

    if (user.role !== "STORE_ADMIN") {
      throw new BadRequestError(
        "Only users with STORE_ADMIN role can be assigned to a store",
      );
    }

    return prisma.user.update({
      where: { id: body.userId },
      data: { storeId: params.id },
      select: { id: true, name: true, email: true, storeId: true, role: true },
    });
  }
}
