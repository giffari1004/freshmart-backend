import { Prisma } from "../../../../generated/prisma";
import { prisma } from "../../../configs/prisma-client-config";
import { BadRequestError } from "../../../errors/BadRequestError";
import { NotFoundError } from "../../../errors/NotFoundError";
import { OrderAdminListInput } from "./order-admin.type";

type AdminOrderStatus =
  | "PROCESSED"
  | "SHIPPED"
  | "CANCELLED";

export class OrderAdminRepository {
  async getOrders(
    query: OrderAdminListInput["query"],
    storeId: string | null,
  ) {
    const {
      page,
      limit,
      status,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.OrderWhereInput = {
      ...(storeId ? { storeId } : {}),
      ...(status ? { status } : {}),
    };

    const skip = (page - 1) * limit;

    const [orders, totalItems] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          {
            [sortBy]: sortOrder,
          },
          {
            id: "asc",
          },
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
        },
      }),

      prisma.order.count({
        where,
      }),
    ]);

    return {
      orders,
      totalItems,
      page,
      limit,
    };
  }

  async updateStatus(
    orderId: string,
    status: AdminOrderStatus,
    actorId: string,
    storeId: string | null,
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          ...(storeId ? { storeId } : {}),
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      const allowed = isValidTransition(
        order.status,
        status,
      );

      if (!allowed) {
        throw new BadRequestError(
          `Invalid order status transition: ${order.status} -> ${status}`,
        );
      }

      const updated = await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status,
          shippedAt:
            status === "SHIPPED"
              ? new Date()
              : undefined,
          cancelledAt:
            status === "CANCELLED"
              ? new Date()
              : undefined,
        },
      });

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
}

function isValidTransition(
  current: string,
  next: AdminOrderStatus,
): boolean {
  if (next === "PROCESSED") {
    return current === "PAID";
  }

  if (next === "SHIPPED") {
    return current === "PROCESSED";
  }

  if (next === "CANCELLED") {
    return (
      current === "PAID" ||
      current === "PROCESSED"
    );
  }

  return false;
}