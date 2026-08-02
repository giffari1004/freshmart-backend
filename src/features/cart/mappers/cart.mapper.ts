import {
  CartItemResponse,
  CartResponse,
} from "../cart.types";

export class CartMapper {
  static toCartResponse(
    cart: CartResponse
  ): CartResponse {
    return cart;
  }

  static toCartItemResponse(
    item: CartItemResponse
  ): CartItemResponse {
    return item;
  }
}