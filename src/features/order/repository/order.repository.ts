import { prisma } from "../../../configs/prisma-client-config";
import {
  runCreateOrderTransaction,
  CreateOrderTransactionData,
} from "../order.transaction";

const cartInclude = {
  items: {
    include: { storeProduct: { include: { product: true, store: true } } },
  },
} as const;

export class OrderRepository {
  async getCartForOrder(userId: string) {
    return prisma.cart.findFirst({
      where: { userId, deletedAt: null },
      include: cartInclude,
    });
  }

  async getUserAddress(userId: string, addressId: string) {
    return prisma.userAddress.findFirst({
      where: { id: addressId, userId, deletedAt: null },
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
        store: { isActive: true, deletedAt: null },
      },
    });
  }

  async getUserVoucher(userId: string, userVoucherId: string) {
    return prisma.userVoucher.findFirst({
      where: { id: userVoucherId, userId },
      include: { voucher: true },
    });
  }

  async createOrderTransaction(data: CreateOrderTransactionData) {
    return prisma.$transaction((tx) => runCreateOrderTransaction(tx, data));
  }
}
