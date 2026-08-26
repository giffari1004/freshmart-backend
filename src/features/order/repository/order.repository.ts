import { Prisma } from "../../../../generated/prisma";
import { prisma } from "../../../configs/prisma-client-config";
import {
  runCreateOrderTransaction,
  CreateOrderTransactionData,
} from "../order.transaction";
import { cancelOrderTransaction } from "../order.cancellation";
import type { OrderListQuery } from "../order.type";

const ORDER_LIST_SELECT = {
  id: true,
  orderNumber: true,
  status: true,
  subtotal: true,
  discountAmount: true,
  shippingCost: true,
  totalAmount: true,
  createdAt: true,
} as const;

const cartInclude = {
  items: {
    include: {
      storeProduct: {
        include: {
          product: true,
          store: true,
        },
      },
    },
  },
} as const;

export class OrderRepository {
  async getCartForOrder(userId: string) {
    return prisma.cart.findFirst({
      where: {
        userId,
      },
      include: cartInclude,
    });
  }

  async getUserAddress(userId: string, addressId: string) {
    return prisma.userAddress.findFirst({
      where: {
        id: addressId,
        userId,
        deletedAt: null,
      },
    });
  }

  async getShippingMethod(
    shippingMethodId: string,
    storeId: string,
    destinationCity: string,
  ) {
    return prisma.shippingMethod.findFirst({
      where: {
        id: shippingMethodId,
        storeId,
        destinationCity,
        store: {
          isActive: true,
          deletedAt: null,
        },
      },
    });
  }

  async getUserVoucher(userId: string, userVoucherId: string) {
    return prisma.userVoucher.findFirst({
      where: {
        id: userVoucherId,
        userId,
      },
      include: {
        voucher: true,
      },
    });
  }

  async createOrderTransaction(
    data: CreateOrderTransactionData,
  ) {
    return prisma.$transaction((tx) =>
      runCreateOrderTransaction(tx, data),
    );
  }

  async getOrdersByUser(
    userId: string,
    query: OrderListQuery,
  ) {
    const {
      page,
      limit,
      status,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.OrderWhereInput = {
      userId,
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
        select: ORDER_LIST_SELECT,
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

  async getOrderForCancellation(
    orderId: string,
    userId: string,
  ) {
    return prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  async cancelOrder(
    orderId: string,
    userId: string,
  ) {
    return prisma.$transaction((tx) =>
      cancelOrderTransaction(
        tx,
        orderId,
        userId,
      ),
    );
  }

  async getOrderForConfirmation(
    orderId: string,
    userId: string,
  ) {
    return prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  async confirmOrder(
    orderId: string,
    userId: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          userId,
          status: "SHIPPED",
        },
        select: {
          id: true,
        },
      });

      if (!order) {
        return null;
      }

      const updated = await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "CONFIRMED",
          changedById: userId,
          notes: "Order confirmed by customer",
        },
      });

      return updated;
    });
  }

  async getOrderDetail(
    orderId: string,
    userId: string,
  ) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      return null;
    }

    const [store, shipping] =
      await Promise.all([
        prisma.store.findUnique({
          where: {
            id: order.storeId,
          },
        }),

        prisma.shippingMethod.findUnique({
          where: {
            id: order.shippingMethodId,
          },
        }),
      ]);

    return {
      order,
      store,
      shipping,
    };
  }
}