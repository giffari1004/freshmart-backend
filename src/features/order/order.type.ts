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