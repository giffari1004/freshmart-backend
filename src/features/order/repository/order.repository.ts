import { prisma } from "../../../configs/prisma-client-config";
import { runCreateOrderTransaction, CreateOrderTransactionData } from "../order.transaction";

const cartInclude = { items: { include: { storeProduct: { include: { product: true, store: true } } } } } as const;

export class OrderRepository {
  async getCartForOrder(userId: string) {
    return prisma.cart.findFirst({ where: { userId, deletedAt: null }, include: cartInclude });
  }

  async getUserAddress(userId: string, addressId: string) {
    return prisma.userAddress.findFirst({ where: { id: addressId, userId, deletedAt: null } });
  }

  async getShippingMethod(shippingMethodId: string, storeId: string, destinationCity: string) {
    return prisma.shippingMethod.findFirst({ where: { id: shippingMethodId, storeId, destinationCity, store: { isActive: true, deletedAt: null } } });
  }

  async getUserVoucher(userId: string, userVoucherId: string) {
    return prisma.userVoucher.findFirst({ where: { id: userVoucherId, userId }, include: { voucher: true } });
  }

  async createOrderTransaction(data: CreateOrderTransactionData) {
    return prisma.$transaction((tx) => runCreateOrderTransaction(tx, data));
  }

  async getOrdersByUser(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
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
    });
  }

  async getOrderDetail(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, payments: true },
    });
    if (!order) return null;
    const [store, shipping] = await Promise.all([
      prisma.store.findUnique({ where: { id: order.storeId } }),
      prisma.shippingMethod.findUnique({ where: { id: order.shippingMethodId } }),
    ]);
    return { order, store, shipping };
  }
}
