import { Prisma } from "../../../../../generated/prisma";
import { NotFoundError } from "../../../../errors/NotFoundError";
import { releaseReservedStock } from "../../../order/order.cancellation";

type WebhookItem = {
  productId: string;
  quantity: number;
};

export async function deductReservedStock(
  tx: Prisma.TransactionClient,
  orderId: string,
  storeId: string,
  items: WebhookItem[],
): Promise<void> {
  for (const item of items) {
    await deductItem(tx, orderId, storeId, item);
  }
}

async function deductItem(
  tx: Prisma.TransactionClient,
  orderId: string,
  storeId: string,
  item: WebhookItem,
): Promise<void> {
  const storeProduct = await findStoreProduct(
    tx,
    storeId,
    item.productId,
  );

  const updated = await deductStock(
    tx,
    storeProduct.id,
    item.quantity,
  );

  await createOutJournal(
    tx,
    orderId,
    storeProduct.id,
    item.quantity,
    updated,
  );
}

async function findStoreProduct(
  tx: Prisma.TransactionClient,
  storeId: string,
  productId: string,
) {
  const storeProduct = await tx.storeProduct.findFirst({
    where: { storeId, productId },
    select: { id: true },
  });

  if (!storeProduct) {
    throw new NotFoundError("Store product not found");
  }

  return storeProduct;
}

async function deductStock(
  tx: Prisma.TransactionClient,
  storeProductId: string,
  quantity: number,
) {
  const rows = await tx.$queryRaw<
    { stockQuantity: number; reservedStock: number }[]
  >`
    UPDATE "store_products"
    SET
      "stockQuantity" = "stockQuantity" - ${quantity},
      "reservedStock" = "reservedStock" - ${quantity}
    WHERE "id" = ${storeProductId}
      AND "stockQuantity" >= ${quantity}
      AND "reservedStock" >= ${quantity}
    RETURNING "stockQuantity", "reservedStock"
  `;

  const updated = rows[0];

  if (!updated) {
    throw new Error("Reserved stock could not be deducted");
  }

  return updated;
}

async function createOutJournal(
  tx: Prisma.TransactionClient,
  orderId: string,
  storeProductId: string,
  quantity: number,
  updated: { stockQuantity: number; reservedStock: number },
): Promise<void> {
  await tx.stockJournal.create({
    data: {
      storeProductId,
      type: "OUT",
      quantity,
      beforeStock: updated.stockQuantity + quantity,
      afterStock: updated.stockQuantity,
      referenceType: "ORDER",
      referenceId: orderId,
      notes: "Stock deducted after successful payment",
    },
  });
}

export function releaseWebhookStock(
  tx: Prisma.TransactionClient,
  orderId: string,
  storeId: string,
  items: WebhookItem[],
): Promise<unknown> {
 return releaseReservedStock(
  tx,
  orderId,
  storeId,
  items,
  "ORDER_CANCEL",
);
}