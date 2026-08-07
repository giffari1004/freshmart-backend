import { CartRepository } from "../../cart/repositories/cart.repository";

export class CheckoutRepository {
    constructor(
        private readonly cartRepository  = new CartRepository(),
    ) {}

    async getCheckoutPreview(userId: string) {
        return this.cartRepository.getCartWithItems(userId);

    }
}
