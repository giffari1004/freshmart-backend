import { Prisma } from "../../../../generated/prisma";
import { CreateOrderResponse } from "../order.type";

interface OrderMapperInput {
  id: string;
  orderNumber: string;
  status: string;

  subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  shippingCost: Prisma.Decimal;
  totalAmount: Prisma.Decimal;

  items: Array<{
    productId: string;
    productNameSnapshot: string;
    priceSnapshot: Prisma.Decimal;
    quantity: number;
    subtotal: Prisma.Decimal;
  }>;
}

export class OrderMapper {
  static toCreateOrderResponse(
    order: OrderMapperInput,
  ): CreateOrderResponse {
    return {
      id: order.id,

      orderNumber:
        order.orderNumber,

      status:
        order.status,

      subtotal:
        Number(order.subtotal),

      discountAmount:
        Number(order.discountAmount),

      shippingCost:
        Number(order.shippingCost),

      totalAmount:
        Number(order.totalAmount),

      items: order.items.map(
        (item) => ({
          productId:
            item.productId,

          productName:
            item.productNameSnapshot,

          unitPrice:
            Number(item.priceSnapshot),

          quantity:
            item.quantity,

          subtotal:
            Number(item.subtotal),
        }),
      ),
    };
  }
}