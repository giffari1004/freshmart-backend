import { prisma } from "../../../configs/prisma-client-config";

export class OrderRepository {
  async getCartForOrder(userId: string) {
    return prisma.cart.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
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
      },
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

  async createOrderTransaction(data: {
    userId: string;
    storeId: string;

    recipientName: string;
    recipientPhone: string;

    province: string;
    city: string;
    district: string;
    fullAddress: string;

    shippingMethodId: string;

    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    totalAmount: number;

    userVoucherId?: string;

    items: Array<{
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      const orderNumber = `ORD-${Date.now()}`;

      const order = await tx.order.create({
        data: {
          orderNumber,

          userId: data.userId,
          storeId: data.storeId,

          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,

          province: data.province,
          city: data.city,
          district: data.district,
          fullAddress: data.fullAddress,

          shippingMethodId: data.shippingMethodId,

          status: "WAITING_PAYMENT",

          subtotal: data.subtotal,

          discountAmount: data.discountAmount,

          shippingCost: data.shippingCost,

          totalAmount: data.totalAmount,
        },
      });

      await tx.orderItem.createMany({
        data: data.items.map((item) => ({
          orderId: order.id,

          productId: item.productId,

          productNameSnapshot: item.productName,

          priceSnapshot: item.unitPrice,

          quantity: item.quantity,

          subtotal: item.subtotal,
        })),
      });

      if (data.userVoucherId) {
        await tx.orderVoucher.create({
          data: {
            orderId: order.id,

            userVoucherId: data.userVoucherId,

            amountDeducted: data.discountAmount,
          },
        });
      }

      await tx.payment.create({
        data: {
          orderId: order.id,

          method: "GATEWAY",

          status: "PENDING",

          amount: data.totalAmount,
        },
      });

      return tx.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },

        include: {
          items: true,
          orderVouchers: true,
          payments: true,
        },
      });
    });
  }
}
