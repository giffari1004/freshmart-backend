import { Prisma } from "../../../../generated/prisma";
import { prisma } from "../../../configs/prisma-client-config";

const ORDER_SELECT = {
  id: true,
  orderNumber: true,
  status: true,
  totalAmount: true,
  createdAt: true,
  store: { select: { id: true, name: true, code: true } },
} as const;

type AdminStatus = Prisma.OrderWhereInput["status"];

export class OrderAdminRepository {
  async findOrders(
    storeId: string | null,
    page: number,
    limit: number,
    status?: AdminStatus,
  ) {
    const where: Prisma.OrderWhereInput = {
      ...(storeId ? { storeId } : {}),
      ...(status ? { status } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: ORDER_SELECT,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  async findOrder(orderId: string, storeId: string | null) {
    return prisma.order.findFirst({
      where: { id: orderId, ...(storeId ? { storeId } : {}) },
      select: { id: true, status: true },
    });
  }

  async updateStatus(
    orderId: string,
    storeId: string | null,
    status: "PROCESSING" | "SHIPPED" | "CANCELLED",
  ) {
    const where = {
      id: orderId,
      ...(storeId ? { storeId } : {}),
      ...(status === "SHIPPED"
        ? { status: "PROCESSING" as const }
        : { status: { in: ["PAID", "PROCESSING"] as const } }),
    };

    return prisma.order.updateMany({
      where,
      data: { status },
    });
  }
}
