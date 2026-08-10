export interface CheckoutItem {
  id: string;
  productName: string;
  imageUrl: string | null;

  quantity: number;

  unitPrice: number;

  subtotal: number;

  weight: number;
}

export interface CheckoutPreviewResponse {
  items: CheckoutItem[];

  totalItems: number;

  totalWeight: number;

  subtotal: number;
}