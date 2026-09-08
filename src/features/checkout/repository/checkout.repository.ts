import { prisma } from "../../../configs/prisma-client-config";
import { CartRepository } from "../../cart/repositories/cart.repository";

export class CheckoutRepository {
  constructor(private readonly cartRepository = new CartRepository()) {}

  async getCheckoutPreview(userId: string) {
    return this.cartRepository.getCartWithItems(userId);
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

  async getUserAddresses(userId: string) {
    return prisma.userAddress.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });
  }

  async getUserVouchers(userId: string) {
    return prisma.userVoucher.findMany({
      where: {
        userId,
        isUsed: false,
        voucher: { isActive: true, expiredAt: { gt: new Date() } },
      },
      include: { voucher: true },
      orderBy: { id: "desc" },
    });
  }

  async createShippingMethodSnapshots(
    storeId: string,
    destinationCity: string,
    options: Array<{
      courierCode: string;
      serviceCode: string;
      serviceName: string;
      cost: number;
      etd: string;
    }>,
  ) {
    return prisma.$transaction(
      options.map((option) =>
        prisma.shippingMethod.create({
          data: {
            storeId,
            destinationCity,
            courierCode: option.courierCode,
            serviceCode: option.serviceCode,
            serviceName: option.serviceName,
            cost: option.cost,
            etd: option.etd,
          },
        }),
      ),
    );
  }
}
