import { prisma } from "../../configs/prisma-client-config";
import { ConflictError } from "../../errors/ConflictError";
import { Forbidden } from "../../errors/Forbidden";
import { NotFoundError } from "../../errors/NotFoundError";
import { AuthUser } from "../../middlewares/auth-middleware";

export function getPagination(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}
export function createMeta(page: number, limit: number, totalData: number) {
  return {
    page,
    limit,
    totalData,
    totalPages: Math.ceil(totalData / limit),
  };
}
export async function findInventoryOrError(id: string) {
  const existingInventory = await prisma.storeProduct.findUnique({
    where: {
      id,
      deletedAt: null,
    },
  });
  if (!existingInventory) throw new NotFoundError("Inventory not found");
  return existingInventory;
}
export async function checkInventoryDuplicate(
  storeId: string,
  productId: string,
) {
  const existingInventory = await prisma.storeProduct.findUnique({
    where: {
      storeId_productId: {
        storeId: storeId,
        productId: productId,
      },
    },
  });
  if (existingInventory)
    throw new ConflictError(
      "Inventory with storeId and productId is already exists",
    );
}
export async function beforeAndAfterStock(
  stockQuantity: number,
  quantity: number,
  id: string,
  notes: string | undefined,
  user: AuthUser,
  type: "IN" | "OUT",
) {
  const beforeStock = stockQuantity;
  const afterStock =
    type === "IN" ? beforeStock + quantity : beforeStock - quantity;
  const result = await prisma.$transaction(async (tx) => {
    const createJournal = await tx.stockJournal.create({
      data: {
        storeProductId: id,
        type,
        quantity,
        beforeStock,
        afterStock,
        referenceType: "MANUAL_ADJUSTMENT",
        referenceId: null,
        notes: notes,
        createdById: user.id,
      },
    });
    const updateStoreProduct = await tx.storeProduct.update({
      where: {
        id,
      },
      data: {
        stockQuantity: afterStock,
      },
    });
    return { createJournal, updateStoreProduct };
  });
  return result;
}
export function accessStoreForAdmin(user: AuthUser, storeId: string) {
  if (user.role === "SUPER_ADMIN") return;
  if (user.storeId !== storeId)
    throw new Forbidden("Access denied you not admin in this store");
}
