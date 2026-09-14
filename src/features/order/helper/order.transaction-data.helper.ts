import type { CreateOrderRequest } from "../order.type";
import type { CreateOrderTransactionData } from "../order.transaction";
import type { OrderItemCalculation } from "./order.helper";

interface StoreData {
  id: string;
}

interface AddressData {
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  fullAddress: string;
}

interface ShippingData {
  id: string;
  cost: unknown;
}

// PERBAIKAN: hapus ketergantungan langsung pada DiscountUsageDetail Feature 2.
export function buildOrderTransactionData(
  userId: string,
  payload: CreateOrderRequest,
  store: StoreData,
  address: AddressData,
  shipping: ShippingData,
  items: OrderItemCalculation[],
  discountAmount: number,
): CreateOrderTransactionData {
  return {
    userId,
    storeId: store.id,
    ...mapAddress(address),
    shippingMethodId: shipping.id,
    ...mapPricing(items, discountAmount, shipping.cost),
    userVoucherId: payload.userVoucherId,
    items,
  };
}

function mapAddress(address: AddressData) {
  return {
    recipientName: address.recipientName,
    recipientPhone: address.phone,
    province: address.province,
    city: address.city,
    district: address.district,
    fullAddress: address.fullAddress,
  };
}

function mapPricing(
  items: OrderItemCalculation[],
  discountAmount: number,
  shippingCost: unknown,
) {
  const subtotal = calculateSubtotal(items);
  const cost = Number(shippingCost);
  return {
    subtotal,
    discountAmount,
    shippingCost: cost,
    totalAmount: subtotal - discountAmount + cost,
  };
}

function calculateSubtotal(items: OrderItemCalculation[]) {
  return items.reduce((total, item) => total + item.subtotal, 0);
}
