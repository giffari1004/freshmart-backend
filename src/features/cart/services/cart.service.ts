import { StoreProduct } from "../../../../generated/prisma";
import { BadRequestError } from "../../../errors/BadRequestError";
import { NotFoundError } from "../../../errors/NotFoundError";
import { CartRepository } from "../repositories/cart.repository";
import { calculateAvailableStock } from "../helpers/cart.helper";
import { CART_MESSAGE } from "../constants/cart.constant";
import { AddToCartDto, UpdateCartDto } from "../validations/cart.validation";

export class CartService {
  constructor(private readonly cartRepository = new CartRepository()) {}

  async addToCart(userId: string, payload: AddToCartDto) {
    const cart = await this.getOrCreateCart(userId);

    const storeProduct = await this.getStoreProduct(payload.storeProductId);

    this.validateStock(storeProduct, payload.quantity);

    await this.saveCartItem(cart.id, storeProduct.id, payload.quantity);
    return this.getCart(userId);
  }

  async getCart(userId: string) {
    const cart = await this.cartRepository.getCartWithItems(userId);
    if (!cart) {
      throw new NotFoundError(CART_MESSAGE.CART_NOT_FOUND);
    }
    return cart;
  }

  async updateQuantity(userid: string, ItemId: string, payload: UpdateCartDto) {
    const item = await this.getCartItem(ItemId, userid);
    this.validateStock(item.storeProduct, payload.quantity);

    await this.cartRepository.updateCartItemQuantity(item.id, payload.quantity);
    return this.getCart(userid);
  }

  async removeItem(userId: string, itemId: string) {
    await this.getCartItem(itemId, userId);

    await this.cartRepository.deleteCartItem(itemId);
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.cartRepository.clearCart(cart.id);

    return {
      message: CART_MESSAGE.CART_CLEARED,
    };
  }

  private async getOrCreateCart(userId: string) {
    const cart = await this.cartRepository.findCartByUserId(userId);

    if (cart) {
      return cart;
    }

    return this.cartRepository.createCart(userId);
  }
  private async getStoreProduct(storeProductId: string) {
    const storeProduct =
      await this.cartRepository.findStoreProductById(storeProductId);

    if (!storeProduct) {
      throw new NotFoundError(CART_MESSAGE.STORE_PRODUCT_NOT_FOUND);
    }

    if (storeProduct.deletedAt) {
      throw new BadRequestError(CART_MESSAGE.STORE_PRODUCT_NOT_FOUND);
    }

    return storeProduct;
  }

  private validateStock(storeProduct: StoreProduct, quantity: number) {
    const availableStock = calculateAvailableStock(
      storeProduct.stockQuantity,
      storeProduct.reservedStock,
    );

    if (quantity > availableStock) {
      throw new BadRequestError(CART_MESSAGE.OUT_OF_STOCK);
    }
  }
  private async saveCartItem(
    cartId: string,
    storeProductId: string,
    quantity: number,
  ) {
    const item = await this.cartRepository.findCartItem(cartId, storeProductId);
    return item
      ? this.cartRepository.updateCartItemQuantity(
          item.id,
          item.quantity + quantity,
        )
      : this.cartRepository.createCartItem(cartId, storeProductId, quantity);
  }
  private async getCartItem(itemId: string, userId: string) {
    const item = await this.cartRepository.findCartItemById(itemId, userId);

    if (!item) {
      throw new NotFoundError(CART_MESSAGE.ITEM_NOT_FOUND);
    }

    return item;
  }
}
