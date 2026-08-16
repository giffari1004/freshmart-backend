export interface CreateOrderRequest {
  addressId: string;
  shippingMethodId: string;
  userVoucherId?: string;
}

export interface CreateOrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CreateOrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  items: CreateOrderItem[];
}

export interface OrderListItemResponse {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  createdAt: string;
}

export interface OrderDetailResponse {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  store: { id: string; name: string; code: string };
  deliveryAddress: {
    recipientName: string;
    recipientPhone: string;
    province: string;
    city: string;
    district: string;
    fullAddress: string;
  };
  shipping: {
    id: string;
    courierCode: string;
    serviceCode: string;
    serviceName: string;
    cost: number;
    etd: string | null;
  };
  items: CreateOrderItem[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  payment: { method: string; status: string; amount: number } | null;
}
