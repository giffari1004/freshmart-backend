import { Prisma } from "../../../generated/prisma";
import { BadRequestError } from "../../errors/BadRequestError";

import type { OrderItemCalculation } from "./helper/order.helper";



export async function reserveStockItem(
  tx: Prisma.TransactionClient,
  orderId: string,
  item: OrderItemCalculation,
) {
  const stock = await updateReservedStock(tx, item);
  if (!stock) {
    throw new BadRequestError(
      `Insufficient stock for product ${item.productName}`,
    );
  }

  await createReserveJournal(
    tx,
    orderId,
    item,
    stock.stockQuantity,
  );
}

async function updateReservedStock(
  tx: Prisma.TransactionClient,
  item: OrderItemCalculation,
) {
  const rows = await tx.$queryRaw<
    { stockQuantity: number; reservedStock: number }[]
  >`
    UPDATE "store_products"
    SET "reservedStock" = "reservedStock" + ${item.quantity}
    WHERE "id" = ${item.storeProductId}
      AND ("stockQuantity" - "reservedStock") >= ${item.quantity}
    RETURNING "stockQuantity", "reservedStock"
  `;

  return rows[0];
}

async function createReserveJournal(
  tx: Prisma.TransactionClient,
  orderId: string,
  item: OrderItemCalculation,
  stockQuantity: number,
) {
  await tx.stockJournal.create({
    data: buildReserveJournalData(
      orderId,
      item,
      stockQuantity,
    ),
  });
}

function buildReserveJournalData(
  orderId: string,
  item: OrderItemCalculation,
  stockQuantity: number,
) {
  return {
    storeProductId: item.storeProductId,
    type: "RESERVE" as const,
    quantity: item.quantity,
    beforeStock: stockQuantity,
    afterStock: stockQuantity,
    referenceType: "ORDER" as const,
    referenceId: orderId,
    notes: "Stock reserved for order",
  };
}