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
}