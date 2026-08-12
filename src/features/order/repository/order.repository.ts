import { prisma } from "../../../configs/prisma-client-config";
import { BadRequestError } from "../../../errors/BadRequestError";

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
      storeProductId: string;
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      const orderNumber = `ORD-${Date.now()}`;

      // ==============================
      // 1. Create Order
      // ==============================

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

      // ==============================
      // 2. Create Order Items
      // ==============================

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

      // ==============================
      // 3. Reserve Stock
      // ==============================

      for (const item of data.items) {
        const updatedRows = await tx.$executeRaw`
            UPDATE "store_products"
            SET
              "reservedStock" =
                "reservedStock" + ${item.quantity}
            WHERE
              "id" = ${item.storeProductId}
              AND
              (
                "stockQuantity" -
                "reservedStock"
              ) >= ${item.quantity}
          `;

        if (updatedRows === 0) {
          throw new BadRequestError(
            `Insufficient stock for product ${item.productName}`,
          );
        }
      }

      // ==============================
      // 4. Create Order Voucher
      // ==============================

      if (data.userVoucherId) {
        await tx.orderVoucher.create({
          data: {
            orderId: order.id,

            userVoucherId: data.userVoucherId,

            amountDeducted: data.discountAmount,
          },
        });
      }

      // ==============================
      // 5. Create Payment
      // ==============================

      await tx.payment.create({
        data: {
          orderId: order.id,

          method: "GATEWAY",

          status: "PENDING",

          amount: data.totalAmount,

          gatewayOrderId: order.orderNumber,
        },
      });

      // ==============================
      // 6. Return Created Order
      // ==============================

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
