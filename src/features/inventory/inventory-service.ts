import { Prisma } from "../../../generated/prisma";
import {
  createInventorySchema,
  deleteInventorySchema,
  getAllInventorySchema,
  getStockHistorySchema,
  stockInSchema,
  stockOutSchema,
  updateInventorySchema,
} from "./inventory-validation";
import { prisma } from "../../configs/prisma-client-config";
import { ConflictError } from "../../errors/ConflictError";
import {
  accessStoreForAdmin,
  beforeAndAfterStock,
  checkInventoryDuplicate,
  createMeta,
  findInventoryOrError,
  getPagination,
} from "./inventory-helper";
import { INVENTORY_SELECT_FIELD } from "./inventory-constant";
import { AuthUser } from "../../middlewares/auth-middleware";

export class InventoryService {
  static async getAllInventory({ query }: getAllInventorySchema) {
    const { page, limit, search, sortBy, sortOrder, storeId } = query;
    const { skip, take } = getPagination(page, limit);
    const where: Prisma.StoreProductWhereInput = {
      deletedAt: null,
      ...(search && {
        product: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      }),
      ...(storeId && { storeId }),
    };
    const [inventories, totalData] = await Promise.all([
      prisma.storeProduct.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          product: true,
          store: true,
        },
      }),
      prisma.storeProduct.count({ where }),
    ]);
    const meta = createMeta(page, limit, totalData);
    return { inventories, meta };
  }
  static async createInventory({ body }: createInventorySchema) {
    await checkInventoryDuplicate(body.storeId, body.productId);
    const createInventory = await prisma.storeProduct.create({
      data: {
        storeId: body.storeId,
        productId: body.productId,
        priceOverride: body.priceOverride,
      },
      select: INVENTORY_SELECT_FIELD,
    });
    return createInventory;
  }
  static async updateInventory({ params, body }: updateInventorySchema) {
    await findInventoryOrError(params.id);
    const updateInventory = await prisma.storeProduct.update({
      where: {
        id: params.id,
      },
      data: {
        priceOverride: body.priceOverride,
      },
      select: INVENTORY_SELECT_FIELD,
    });
    return updateInventory;
  }
  static async deleteInventory({ params }: deleteInventorySchema) {
    await findInventoryOrError(params.id);
    const updateInventory = await prisma.storeProduct.update({
      where: {
        id: params.id,
      },
      data: {
        deletedAt: new Date(),
      },
      select: INVENTORY_SELECT_FIELD,
    });
    return updateInventory;
  }
  static async stockIn({ params, body }: stockInSchema, user: AuthUser) {
    const existingInventory = await findInventoryOrError(params.id);
    accessStoreForAdmin(user, existingInventory.storeId);
    const result = await beforeAndAfterStock(
      existingInventory.stockQuantity,
      body.quantity,
      existingInventory.id,
      body.notes,
      user,
      "IN",
    );
    return result;
  }
  static async stockOut({ params, body }: stockOutSchema, user: AuthUser) {
    const existingInventory = await findInventoryOrError(params.id);
    accessStoreForAdmin(user, existingInventory.storeId);
    if (existingInventory.stockQuantity < body.quantity)
      throw new ConflictError("Inventory stockquantity not enough");
    const result = await beforeAndAfterStock(
      existingInventory.stockQuantity,
      body.quantity,
      existingInventory.id,
      body.notes,
      user,
      "OUT",
    );
    return result;
  }
  static async getStockHistory(
    { params, query }: getStockHistorySchema,
    user: AuthUser,
  ) {
    const result = await findInventoryOrError(params.id);
    accessStoreForAdmin(user, result.storeId);
    const { page, limit, type, sortBy, sortOrder } = query;
    const { skip, take } = getPagination(page, limit);
    const where: Prisma.StockJournalWhereInput = {
      storeProductId: params.id,
      ...(type && { type }),
    };
    const [histories, totalData] = await Promise.all([
      prisma.stockJournal.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.stockJournal.count({ where }),
    ]);
    const meta = createMeta(page, limit, totalData);
    return { histories, meta };
  }
}
