import { Prisma } from "../../../../generated/prisma";
import { prisma } from "../../../configs/prisma-client-config";
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

const CART_INCLUDE = {
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

type OrderDetailRecord = Prisma.OrderGetPayload<{
  include: { items: true; payments: true };
}>;

export class OrderQueryRepository {
  getCartForOrder(userId: string) {
    return prisma.cart.findFirst({
      where: { userId },
      include: CART_INCLUDE,
    });
  }

  getUserAddress(userId: string, addressId: string) {
    return prisma.userAddress.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });
  }

  getShippingMethod(
    shippingMethodId: string,
    storeId: string,
    destinationCity: string,
  ) {
    return prisma.shippingMethod.findFirst({
      where: {
        id: shippingMethodId,
        storeId,
        destinationCity,
        store: { isActive: true, deletedAt: null },
      },
    });
  }

  getUserVoucher(userId: string, userVoucherId: string) {
    return prisma.userVoucher.findFirst({
      where: { id: userVoucherId, userId },
      include: { voucher: true },
    });
  }

  async getOrdersByUser(userId: string, query: OrderListQuery) {
    // PERBAIKAN: pagination/query execution dipindahkan ke helper.
    const where = buildOrderListWhere(userId, query);
    const [orders, totalItems] = await fetchOrderPage(
      where,
      query,
    );

    return {
      orders,
      totalItems,
      page: query.page,
      limit: query.limit,
    };
  }

  getOrderForCancellation(orderId: string, userId: string) {
    return findActionOrder(orderId, userId);
  }

  getOrderForConfirmation(orderId: string, userId: string) {
    return findActionOrder(orderId, userId);
  }

  async getOrderDetail(orderId: string, userId: string) {
    // PERBAIKAN: query detail dan relasinya dipisah agar method tetap kecil.
    const order = await findOrderDetail(orderId, userId);
    if (!order) return null;

    return getOrderDetailRelations(
      order.storeId,
      order.shippingMethodId,
      order,
    );
  }
}


async function fetchOrderPage(
  where: Prisma.OrderWhereInput,
  query: OrderListQuery,
) {
  const skip = (query.page - 1) * query.limit;

  return prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: [
        { [query.sortBy]: query.sortOrder },
        { id: "asc" },
      ],
      select: ORDER_LIST_SELECT,
    }),
    prisma.order.count({ where }),
  ]);
}

async function findOrderDetail(
  orderId: string,
  userId: string,
) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: true,
      payments: true,
      statusHistories: {
        orderBy: { createdAt: "asc" },
        select: {
          status: true,
          notes: true,
          createdAt: true,
        },
      },
    },
  });
}

// PERBAIKAN: order sudah dipastikan tidak null
// oleh getOrderDetail() sebelum helper ini dipanggil.
async function getOrderDetailRelations(
  storeId: string,
  shippingMethodId: string,
  order: NonNullable<Awaited<ReturnType<typeof findOrderDetail>>>,
) {
  const [store, shipping] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId } }),
    prisma.shippingMethod.findUnique({
      where: { id: shippingMethodId },
    }),
  ]);

  return { order, store, shipping };
}

function buildOrderListWhere(
  userId: string,
  query: OrderListQuery,
): Prisma.OrderWhereInput {
  return {
    userId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.orderNumber
      ? { orderNumber: { contains: query.orderNumber, mode: "insensitive" } }
      : {}),
    ...buildCreatedAtFilter(query.fromDate, query.toDate),
  };
}

function buildCreatedAtFilter(
  fromDate?: string,
  toDate?: string,
): Prisma.OrderWhereInput {
  if (!fromDate && !toDate) return {};

  const createdAt: Prisma.DateTimeFilter = {};
  if (fromDate) createdAt.gte = new Date(`${fromDate}T00:00:00.000Z`);
  if (toDate) createdAt.lt = nextDay(toDate);
  return { createdAt };
}

function nextDay(date: string): Date {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function findActionOrder(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    select: { id: true, status: true },
  });
}
