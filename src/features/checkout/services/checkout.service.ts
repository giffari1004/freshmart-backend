import { NotFoundError } from "../../../errors/NotFoundError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";
import { CheckoutMapper } from "../mappers/checkout.mappers";
import { CheckoutRepository } from "../repository/checkout.repository";

export class CheckoutService {
  constructor(
    private readonly checkoutRepository = new CheckoutRepository(),
  ) {}

  async getCheckoutPreview(userId: string) {
    const cart =
      await this.checkoutRepository.getCheckoutPreview(userId);

    if (!cart || cart.items.length === 0) {
      throw new NotFoundError(CHECKOUT_MESSAGE.CART_EMPTY);
    }

    return CheckoutMapper.toCheckoutPreview(cart);
  }
}