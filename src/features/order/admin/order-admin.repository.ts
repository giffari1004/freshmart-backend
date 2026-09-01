import { Prisma } from "../../../../generated/prisma";
import { prisma } from "../../../configs/prisma-client-config";
import { BadRequestError } from "../../../errors/BadRequestError";
import { NotFoundError } from "../../../errors/NotFoundError";
import { OrderAdminListInput } from "./order-admin.type";

type AdminOrderStatus = "PROCESSED" | "SHIPPED" | "CANCELLED";
type AdminListQuery = OrderAdminListInput["query"];

export class OrderAdminRepository {
  async getOrders(query: AdminListQuery, storeId: string | null) {
    const where = buildWhere(query, storeId);
    const skip = (query.page - 1) * query.limit;
    const [orders, totalItems] = await fetchOrders(where, query, skip);

    return {
      orders,
      totalItems,
      page: query.page,
      limit: query.limit,
    };
  }

  async updateStatus(
    orderId: string,
    status: AdminOrderStatus,
    actorId: string,
    storeId: string | null,
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await findOrderForUpdate(tx, orderId, storeId);
      validateTransition(order.status, status);
      return updateOrderStatus(tx, order, status, actorId);
    });
  }
}

function buildWhere(
  query: AdminListQuery,
  storeId: string | null,
): Prisma.OrderWhereInput {
  return {
    ...(storeId ? { storeId } : {}),
    ...(query.storeId ? { storeId: query.storeId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
}

function fetchOrders(
  where: Prisma.OrderWhereInput,
  query: AdminListQuery,
  skip: number,
) {
  return prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: [
        { [query.sortBy]: query.sortOrder },
        { id: "asc" },
      ],
      select: {
        id: true,
        orderNumber: true,
        status: true,
        subtotal: true,
        discountAmount: true,
        shippingCost: true,
        totalAmount: true,
        createdAt: true,
        store: {
          select: { id: true, name: true, code: true },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);
}

function findOrderForUpdate(
  tx: Prisma.TransactionClient,
  orderId: string,
  storeId: string | null,
) {
  return tx.order.findFirst({
    where: {
      id: orderId,
      ...(storeId ? { storeId } : {}),
    },
    select: { id: true, status: true },
  }).then((order) => {
    if (!order) throw new NotFoundError("Order not found");
    return order;
  });
}

function validateTransition(
  current: string,
  next: AdminOrderStatus,
): void {
  const valid =
    (next === "PROCESSED" && current === "WAITING_CONFIRMATION") ||
    (next === "SHIPPED" && current === "PROCESSED") ||
    (next === "CANCELLED" && ["PAID", "WAITING_CONFIRMATION", "PROCESSED"].includes(current));

  if (!valid) {
    throw new BadRequestError(
      `Invalid order status transition: ${current} -> ${next}`,
    );
  }
}

function updateOrderStatus(
  tx: Prisma.TransactionClient,
  order: { id: string; status: string },
  status: AdminOrderStatus,
  actorId: string,
) {
  const shippedAt = status === "SHIPPED" ? new Date() : undefined;

  return tx.order.update({
    where: { id: order.id },
    data: {
      status,
      shippedAt,
      cancelledAt: status === "CANCELLED" ? new Date() : undefined,
    },
  }).then(async (updated) => {
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status,
        changedById: actorId,
        notes: `Order status changed by admin: ${order.status} -> ${status}`,
      },
    });
    return updated;
  });
}
