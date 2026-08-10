import { prisma } from "../../../configs/prisma-client-config";
export class CartRepository {
  async findCartByUserId(userId: string) {
    return prisma.cart.findUnique({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            storeProduct: {
              include: {
                product: {
                  include: {
                    images: true,
                  },
                },
                store: true,
              },
            },
          },
        },
      },
    });
  }

  async createCart(userId: string) {
    return prisma.cart.create({
      data: {
        userId,
      },
      include: {
        items: true,
      },
    });
  }

  async findStoreProductById(id: string) {
    return prisma.storeProduct.findFirst({
      where: {
        id,
        deletedAt: null,
        product: {
          isActive: true,
        },
        store: {
          isActive: true,
        },
      },
    });
  }

  async findCartItem(cartId: string, storeProductId: string) {
    return prisma.cartItem.findUnique({
      where: {
        cartId_storeProductId: {
          cartId,
          storeProductId,
        },
      },
    });
  }

  async findCartItemById(id: string, userId: string) {
    return prisma.cartItem.findFirst({
      where: {
        id,
        cart: {
          userId,
        },
      },
      include: {
        cart: true,
        storeProduct: true,
      },
    });
  }

  async createCartItem(
    cartId: string,
    storeProductId: string,
    quantity: number,
  ) {
    return prisma.cartItem.create({
      data: {
        cartId,
        storeProductId,
        quantity,
      },
    });
  }

  async updateCartItemQuantity(id: string, quantity: number) {
    return prisma.cartItem.update({
      where: {
        id,
      },
      data: {
        quantity,
      },
    });
  }

  async deleteCartItem(id: string) {
    return prisma.cartItem.delete({
      where: {
        id,
      },
    });
  }

  async clearCart(cartId: string) {
    return prisma.cartItem.deleteMany({
      where: {
        cartId,
      },
    });
  }
  async getCartWithItems(userId: string) {
    return prisma.cart.findUnique({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            storeProduct: {
              include: {
                product: {
                  include: {
                    images: true,
                  },
                },
                store: true,
              },
            },
          },
        },
      },
    });
  }
}
