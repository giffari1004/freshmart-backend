import { Prisma } from "../../../../generated/prisma";
import { BadRequestError } from "../../../errors/BadRequestError";
import { NotFoundError } from "../../../errors/NotFoundError";
import { ProcessWebhookData } from "./payment.webhook.type";
import { releaseReservedStock } from "../../order/order.cancellation";

export async function processWebhookTransaction(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
) {
  // Idempotency check sebelum processing.
  if (await hasEvent(tx, data)) {
    return { duplicate: true };
  }

  // Pastikan payment benar-benar ada.
  const payment = await ensurePayment(tx, data.paymentId);

  // Pastikan payment memang milik order yang menerima webhook.
  if (payment.orderId !== data.orderId) {
    throw new BadRequestError("Payment does not belong to order");
  }

  // Ambil order dan item yang dibutuhkan untuk inventory side effect.
  const order = await tx.order.findUnique({
    where: { id: data.orderId },
    select: {
      id: true,
      storeId: true,
      status: true,
      items: {
        select: {
          productId: true,
          quantity: true,
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  /*
   * Webhook payment hanya boleh memproses order
   * yang masih menunggu pembayaran.
   *
   * Setelah kondisi ini lolos, TypeScript akan melakukan
   * narrowing terhadap order.status menjadi WAITING_PAYMENT.
   * Karena itu jangan membandingkan order.status lagi dengan
   * data.orderStatus di bawah.
   */
  if (order.status !== "WAITING_PAYMENT") {
    return { duplicate: true };
  }

  // Nominal webhook harus sama dengan nominal payment di database.
  if (Number(payment.amount) !== Number(data.grossAmount)) {
    throw new BadRequestError(
      "Webhook gross amount does not match payment amount",
    );
  }

  /*
   * Claim payment secara atomic.
   *
   * Hanya payment PENDING yang boleh diubah.
   * Ini membantu mencegah duplicate webhook memproses
   * side effect untuk kedua kalinya.
   */
  const claimed = await updatePayment(tx, data);

  if (!claimed) {
    return { duplicate: true };
  }

  /*
   * PAYMENT SUCCESS / SETTLEMENT
   *
   * Physical stock dikurangi dan reserved stock dilepas.
   */
  if (data.paymentStatus === "SETTLEMENT") {
    await deductReservedStock(
      tx,
      data.orderId,
      order.storeId,
      order.items,
    );
  }

  /*
   * PAYMENT FAILED / EXPIRED / CANCEL
   *
   * Reserved stock hanya dilepas.
   * Physical stock tidak dikurangi.
   */
  else if (data.releaseStock) {
    await releaseReservedStock(
      tx,
      data.orderId,
      order.storeId,
      order.items,
      "ORDER_CANCEL",
    );
  }

  /*
   * Setelah payment berhasil di-claim dan seluruh
   * inventory side effect berhasil, update order ke
   * status yang sudah ditentukan dari webhook tervalidasi.
   *
   * Tidak perlu lagi:
   * if (order.status !== data.orderStatus)
   *
   * karena sebelumnya order.status sudah di-narrow menjadi
   * WAITING_PAYMENT oleh TypeScript.
   */
  await updateOrderAndHistory(
    tx,
    data.orderId,
    data.orderStatus,
    "Status updated from validated Midtrans webhook",
  );

  // Simpan event webhook setelah seluruh processing berhasil.
  await createEvent(tx, data);

  return { duplicate: false };
}

async function ensurePayment(
  tx: Prisma.TransactionClient,
  paymentId: string,
) {
  const payment = await tx.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  return payment;
}

async function hasEvent(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
) {
  return Boolean(
    await tx.paymentWebhookEvent.findFirst({
      where: {
        orderId: data.orderId,
        transactionId: data.transactionId,
        transactionStatus: data.transactionStatus,
      },
    }),
  );
}

async function updatePayment(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
) {
  const result = await tx.payment.updateMany({
    where: {
      id: data.paymentId,
      status: "PENDING",
    },
    data: {
      status: data.paymentStatus,
      gatewayTransactionId: data.transactionId,
      paidAt:
        data.paymentStatus === "SETTLEMENT"
          ? new Date()
          : undefined,
      expiredAt:
        data.paymentStatus === "EXPIRED"
          ? new Date()
          : undefined,
    },
  });

  return result.count === 1;
}

async function updateOrderAndHistory(
  tx: Prisma.TransactionClient,
  orderId: string,
  status: ProcessWebhookData["orderStatus"],
  notes: string,
) {
  await tx.order.update({
    where: {
      id: orderId,
    },
    data: {
      status,
      cancelledAt:
        status === "CANCELLED"
          ? new Date()
          : undefined,
    },
  });

  await tx.orderStatusHistory.create({
    data: {
      orderId,
      status,
      notes,
    },
  });
}

async function deductReservedStock(
  tx: Prisma.TransactionClient,
  orderId: string,
  storeId: string,
  items: {
    productId: string;
    quantity: number;
  }[],
) {
  for (const item of items) {
    /*
     * OrderItem menyimpan productId,
     * sedangkan inventory berada pada StoreProduct.
     *
     * Jadi StoreProduct dicari berdasarkan:
     * storeId + productId
     */
    const storeProduct = await tx.storeProduct.findFirst({
      where: {
        storeId,
        productId: item.productId,
      },
      select: {
        id: true,
      },
    });

    if (!storeProduct) {
      throw new NotFoundError("Store product not found");
    }

    /*
     * Settlement:
     * stockQuantity berkurang
     * reservedStock berkurang
     *
     * Semua dilakukan secara conditional agar
     * stock/reserve tidak menjadi negatif.
     */
    const rows = await tx.$queryRaw<
      {
        stockQuantity: number;
        reservedStock: number;
      }[]
    >`
      UPDATE "store_products"
      SET
        "stockQuantity" = "stockQuantity" - ${item.quantity},
        "reservedStock" = "reservedStock" - ${item.quantity}
      WHERE "id" = ${storeProduct.id}
        AND "stockQuantity" >= ${item.quantity}
        AND "reservedStock" >= ${item.quantity}
      RETURNING
        "stockQuantity",
        "reservedStock"
    `;

    const updated = rows[0];

    if (!updated) {
      throw new BadRequestError(
        "Reserved stock could not be deducted",
      );
    }

    /*
     * Audit inventory settlement.
     */
    await tx.stockJournal.create({
      data: {
        storeProductId: storeProduct.id,
        type: "OUT",
        quantity: item.quantity,
        beforeStock:
          updated.stockQuantity + item.quantity,
        afterStock: updated.stockQuantity,
        referenceType: "ORDER",
        referenceId: orderId,
        notes: "Stock deducted after successful payment",
      },
    });
  }
}

async function createEvent(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
) {
  await tx.paymentWebhookEvent.create({
    data: {
      paymentId: data.paymentId,
      orderId: data.orderId,
      transactionId: data.transactionId,
      transactionStatus: data.transactionStatus,
      statusCode: data.statusCode,
      grossAmount: data.grossAmount,
      signatureKey: data.signatureKey,
      payload: data.payload,
      isValid: true,
      processedAt: new Date(),
    },
  });
}