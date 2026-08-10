export interface CartProduct {
  id: string;
  name: string;
  imageUrl?: string | null;
}

export interface CartItemResponse {
  id: string;
  storeProductId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: CartProduct;
}

export interface CartResponse {
  id: string;
  userId: string;
  items: CartItemResponse[];
  totalItems: number;
  subtotal: number;
}