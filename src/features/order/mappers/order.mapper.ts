import { Prisma } from "../../../../generated/prisma";
import { CreateOrderResponse, OrderDetailResponse, OrderListItemResponse } from "../order.type";

interface OrderMapperInput {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  shippingCost: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  items: Array<{ productId: string; productNameSnapshot: string; priceSnapshot: Prisma.Decimal; quantity: number; subtotal: Prisma.Decimal }>;
}

type OrderItemInput = OrderMapperInput["items"][number];

type OrderListInput = {
  id: string; orderNumber: string; status: string; subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal; shippingCost: Prisma.Decimal; totalAmount: Prisma.Decimal; createdAt: Date;
};

type OrderDetailInput = {
  order: OrderMapperInput & {
    createdAt: Date; storeId: string; recipientName: string; recipientPhone: string;
    province: string; city: string; district: string; fullAddress: string; shippingMethodId: string;
    payments: Array<{ method: string; status: string; amount: Prisma.Decimal }>;
  };
  store: { id: string; name: string; code: string } | null;
  shipping: { id: string; courierCode: string; serviceCode: string; serviceName: string; cost: Prisma.Decimal; etd: string | null } | null;
};

export class OrderMapper {
  static toCreateOrderResponse(order: OrderMapperInput): CreateOrderResponse {
    return { id: order.id, orderNumber: order.orderNumber, status: order.status, subtotal: Number(order.subtotal), discountAmount: Number(order.discountAmount), shippingCost: Number(order.shippingCost), totalAmount: Number(order.totalAmount), items: order.items.map(toOrderItem) };
  }

  static toOrderListItem(order: OrderListInput): OrderListItemResponse {
    return { id: order.id, orderNumber: order.orderNumber, status: order.status, subtotal: Number(order.subtotal), discountAmount: Number(order.discountAmount), shippingCost: Number(order.shippingCost), totalAmount: Number(order.totalAmount), createdAt: order.createdAt.toISOString() };
  }

  static toOrderDetail(data: OrderDetailInput): OrderDetailResponse {
    const { order, store, shipping } = data;
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      store: mapStore(store, order.storeId),
      deliveryAddress: mapAddress(order),
      shipping: mapShipping(shipping, order.shippingMethodId, Number(order.shippingCost)),
      items: order.items.map(toOrderItem),
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      shippingCost: Number(order.shippingCost),
      totalAmount: Number(order.totalAmount),
      payment: mapPayment(order.payments[0]),
    };
  }
}

function toOrderItem(item: OrderItemInput) {
  return { productId: item.productId, productName: item.productNameSnapshot, unitPrice: Number(item.priceSnapshot), quantity: item.quantity, subtotal: Number(item.subtotal) };
}

function mapStore(store: OrderDetailInput["store"], fallbackId: string) {
  return store ?? { id: fallbackId, name: "", code: "" };
}

function mapAddress(order: OrderDetailInput["order"]) {
  return { recipientName: order.recipientName, recipientPhone: order.recipientPhone, province: order.province, city: order.city, district: order.district, fullAddress: order.fullAddress };
}

function mapShipping(shipping: OrderDetailInput["shipping"], fallbackId: string, fallbackCost: number) {
  return shipping ? { id: shipping.id, courierCode: shipping.courierCode, serviceCode: shipping.serviceCode, serviceName: shipping.serviceName, cost: Number(shipping.cost), etd: shipping.etd } : { id: fallbackId, courierCode: "", serviceCode: "", serviceName: "", cost: fallbackCost, etd: null };
}

function mapPayment(payment: OrderDetailInput["order"]["payments"][number] | undefined) {
  return payment ? { method: payment.method, status: payment.status, amount: Number(payment.amount) } : null;
}
