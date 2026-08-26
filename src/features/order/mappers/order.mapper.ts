import { Prisma } from "../../../../generated/prisma";
import {
  CreateOrderResponse,
  OrderDetailResponse,
  OrderListItemResponse,
} from "../order.type";

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

type OrderItemInput = OrderMapperInput["items"][number];

type OrderListInput = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  shippingCost: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  createdAt: Date;
};

type OrderDetailInput = {
  order: OrderMapperInput & {
    createdAt: Date;
    storeId: string;
    recipientName: string;
    recipientPhone: string;
    province: string;
    city: string;
    district: string;
    fullAddress: string;
    shippingMethodId: string;
    payments: Array<{
      method: string;
      status: string;
      amount: Prisma.Decimal;
    }>;
  };
  store: { id: string; name: string; code: string } | null;
  shipping: {
    id: string;
    courierCode: string;
    serviceCode: string;
    serviceName: string;
    cost: Prisma.Decimal;
    etd: string | null;
  } | null;
};

export class OrderMapper {
  static toCreateOrderResponse(order: OrderMapperInput): CreateOrderResponse {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      shippingCost: Number(order.shippingCost),
      totalAmount: Number(order.totalAmount),
      items: order.items.map(toOrderItem),
    };
  }

  static toOrderListItem(order: OrderListInput): OrderListItemResponse {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      shippingCost: Number(order.shippingCost),
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
    };
  }

  static toOrderDetail(data: OrderDetailInput): OrderDetailResponse {
    return {
      ...mapOrderSummary(data.order),
      store: mapStore(data.store, data.order.storeId),
      deliveryAddress: mapAddress(data.order),
      shipping: mapShipping(
        data.shipping,
        data.order.shippingMethodId,
        Number(data.order.shippingCost),
      ),
      items: data.order.items.map(toOrderItem),
      payment: mapPayment(data.order.payments[0]),
    };
  }
}

function mapOrderSummary(order: OrderDetailInput["order"]) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shippingCost: Number(order.shippingCost),
    totalAmount: Number(order.totalAmount),
  };
}

function toOrderItem(item: OrderItemInput) {
  return {
    productId: item.productId,
    productName: item.productNameSnapshot,
    unitPrice: Number(item.priceSnapshot),
    quantity: item.quantity,
    subtotal: Number(item.subtotal),
  };
}

function mapStore(
  store: OrderDetailInput["store"],
  fallbackId: string,
) {
  return store ?? { id: fallbackId, name: "", code: "" };
}

function mapAddress(order: OrderDetailInput["order"]) {
  return {
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    province: order.province,
    city: order.city,
    district: order.district,
    fullAddress: order.fullAddress,
  };
}

function mapShipping(
  shipping: OrderDetailInput["shipping"],
  fallbackId: string,
  fallbackCost: number,
) {
  if (!shipping) return mapFallbackShipping(fallbackId, fallbackCost);
  return {
    id: shipping.id,
    courierCode: shipping.courierCode,
    serviceCode: shipping.serviceCode,
    serviceName: shipping.serviceName,
    cost: Number(shipping.cost),
    etd: shipping.etd,
  };
}

function mapFallbackShipping(id: string, cost: number) {
  return {
    id,
    courierCode: "",
    serviceCode: "",
    serviceName: "",
    cost,
    etd: null,
  };
}

function mapPayment(
  payment: OrderDetailInput["order"]["payments"][number] | undefined,
) {
  if (!payment) return null;

  return {
    method: payment.method,
    status: payment.status,
    amount: Number(payment.amount),
  };
}
