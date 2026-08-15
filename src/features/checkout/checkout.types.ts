export interface CheckoutPreviewRequest {
  addressId: string;
  shippingMethodId: string;
  userVoucherId?: string;
}

export interface CheckoutItem {
  id: string;
  storeProductId: string;
  productId: string;

  productName: string;
  imageUrl: string | null;

  quantity: number;
  unitPrice: number;
  subtotal: number;
  weight: number;
}

export interface CheckoutAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;

  province: string;
  city: string;
  district: string;
  fullAddress: string;

  latitude: number;
  longitude: number;
}

export interface CheckoutStore {
  id: string;
  name: string;
  code: string;
  distanceKm: number;
}

export interface CheckoutShipping {
  id: string;
  courierCode: string;
  serviceCode: string;
  serviceName: string;

  cost: number;
  etd: string | null;
}

export interface CheckoutDiscount {
  userVoucherId: string | null;
  voucherCode: string | null;
  amount: number;
}

export interface CheckoutPreviewResponse {
  items: CheckoutItem[];

  totalItems: number;
  totalWeight: number;

  subtotal: number;

  discount: CheckoutDiscount;

  shipping: CheckoutShipping;

  totalAmount: number;

  address: CheckoutAddress;

  store: CheckoutStore;
}

export interface CheckoutOptionAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  fullAddress: string;
}

export interface CheckoutOptionShipping {
  id: string;
  courierCode: string;
  serviceCode: string;
  serviceName: string;
  cost: number;
  etd: string | null;
}

export interface CheckoutOptionVoucher {
  id: string;
  code: string;
  usageType: string;
  valueType: string;
  value: number;
  maxDiscountAmount: number | null;
  minPurchaseAmount: number | null;
  expiredAt: string;
}

export interface CheckoutOptionsResponse {
  addresses: CheckoutOptionAddress[];
  shippingMethods: CheckoutOptionShipping[];
  vouchers: CheckoutOptionVoucher[];
}
