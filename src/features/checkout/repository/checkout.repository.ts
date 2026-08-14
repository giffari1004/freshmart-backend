import { prisma } from "../../../configs/prisma-client-config";
import { CartRepository } from "../../cart/repositories/cart.repository";

export class CheckoutRepository {
  constructor(
    private readonly cartRepository = new CartRepository(),
  ) {}

  async getCheckoutPreview(userId: string) {
    return this.cartRepository.getCartWithItems(userId);
  }

  async getUserAddress(
    userId: string,
    addressId: string,
  ) {
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

  async getUserVoucher(
    userId: string,
    userVoucherId: string,
  ) {
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
  async getUserAddresses(userId: string) {
  return prisma.userAddress.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async getUserVouchers(userId: string) {
  return prisma.userVoucher.findMany({
    where: {
      userId,
      isUsed: false,
      voucher: {
        isActive: true,
        expiredAt: {
          gt: new Date(),
        },
      },
    },
    include: {
      voucher: true,
    },
    orderBy: {
      id: "desc",
    },
  });
}

async getCheckoutShippingMethods(
  storeId: string,
  destinationCity: string,
) {
  return prisma.shippingMethod.findMany({
    where: {
      storeId,
      destinationCity,
      store: {
        isActive: true,
        deletedAt: null,
      },
    },
    orderBy: {
      cost: "asc",
    },
  });
}
}