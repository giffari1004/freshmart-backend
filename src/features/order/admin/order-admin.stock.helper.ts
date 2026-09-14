import { Prisma } from "../../../../generated/prisma";
import { NotFoundError } from "../../../errors/NotFoundError";

interface OrderStockItem {
  productId: string;
  quantity: number;
}

export async function restoreCancelledOrderStock(
  tx: Prisma.TransactionClient,
  orderId: string,
  storeId: string,
  items: OrderStockItem[],
) {
  for (const item of items) {
    await restoreItemStock(tx, orderId, storeId, item);
  }
}

async function restoreItemStock(
  tx: Prisma.TransactionClient,
  orderId: string,
  storeId: string,
  item: OrderStockItem,
) {
  const storeProduct = await findStoreProduct(tx, storeId, item.productId);
  const updated = await incrementStock(tx, storeProduct.id, item.quantity);
  await createRestoreJournal(tx, orderId, storeProduct.id, item.quantity, updated);
}

async function findStoreProduct(
  tx: Prisma.TransactionClient,
  storeId: string,
  productId: string,
) {
  const product = await tx.storeProduct.findFirst({
    where: { storeId, productId },
    select: { id: true },
  });
  if (!product) throw new NotFoundError("Store product not found");
  return product;
}

async function incrementStock(
  tx: Prisma.TransactionClient,
  storeProductId: string,
  quantity: number,
) {
  const rows = await tx.$queryRaw<
    { stockQuantity: number; reservedStock: number }[]
  >`
    UPDATE "store_products"
    SET "stockQuantity" = "stockQuantity" + ${quantity}
    WHERE "id" = ${storeProductId}
    RETURNING "stockQuantity", "reservedStock"
  `;
  const updated = rows[0];
  if (!updated) throw new NotFoundError("Store product not found");
  return updated;
}

async function createRestoreJournal(
  tx: Prisma.TransactionClient,
  orderId: string,
  storeProductId: string,
  quantity: number,
  updated: { stockQuantity: number; reservedStock: number },
) {
  await tx.stockJournal.create({
    data: {
      storeProductId,
      type: "IN",
      quantity,
      beforeStock: updated.stockQuantity - quantity,
      afterStock: updated.stockQuantity,
      referenceType: "ORDER_CANCEL",
      referenceId: orderId,
      notes: "Stock restored after order cancellation",
    },
  });
}
