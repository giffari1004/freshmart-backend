import { NotFoundError } from "../../../errors/NotFoundError";
import { CheckoutStoreSelectionService } from "./checkout.store-selection.service";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";
import {
  CheckoutOptionAddress,
  CheckoutOptionShipping,
  CheckoutPreviewRequest,
} from "../checkout.types";
import { CheckoutMapper } from "../mappers/checkout.mappers";
import { CheckoutRepository } from "../repository/checkout.repository";
import {
  applyStoreSelection,
  getAddress,
  getShipping,
} from "../helper/checkout.helper";
import {
  applyCheckoutBogoBonus,
  calculateCheckoutDiscount,
} from "../utils/checkout.discount.util";
import {
  getShippingOptions as fetchShippingOptions,
} from "../../../integrations/rajaongkir-client";

type CartRecord = NonNullable<
  Awaited<ReturnType<CheckoutRepository["getCheckoutPreview"]>>
>;
type AddressRecord = NonNullable<
  Awaited<ReturnType<CheckoutRepository["getUserAddress"]>>
>;
type Selection = Awaited<
  ReturnType<CheckoutStoreSelectionService["selectStore"]>
>;

export class CheckoutService {
  constructor(
    private readonly checkoutRepository = new CheckoutRepository(),
    private readonly storeSelectionService =
      new CheckoutStoreSelectionService(),
  ) {}

  async getCheckoutPreview(
    userId: string,
    payload: CheckoutPreviewRequest,
  ) {
    const cart = await this.getCart(userId);
    const address = await this.getAddress(userId, payload.addressId);
    const selection = await this.selectStore(cart, address);
    const selectedCart = applyStoreSelection(
      cart,
      selection.storeProducts,
    );
    const shipping = await this.getShipping(
      payload,
      selection.store.id,
      address.city,
    );
    const discount = await this.getDiscount(
      userId,
      payload,
      selectedCart,
      Number(shipping.cost),
    );
    const previewCart = await applyCheckoutBogoBonus(selectedCart);

    return CheckoutMapper.toCheckoutPreview(previewCart, {
      address: CheckoutMapper.toAddress(address),
      store: CheckoutMapper.toStore(
        selection.store,
        Number(selection.distanceKm.toFixed(2)),
      ),
      shipping: CheckoutMapper.toShipping(shipping),
      discount,
    });
  }

  async getShippingOptions(
    userId: string,
    addressId: string,
  ): Promise<CheckoutOptionShipping[]> {
    const cart = await this.getCart(userId);
    const address = await this.getAddress(userId, addressId);
    const selection = await this.selectStore(cart, address);
    const weight = this.getTotalWeight(cart);

    const options = await fetchShippingOptions(
      selection.store.rajaOngkirCityId,
      address.rajaOngkirCityId,
      weight,
    );

    return this.createShippingMethods(
      selection.store.id,
      address.city,
      options,
    );
  }

  async getCheckoutAddresses(
    userId: string,
  ): Promise<CheckoutOptionAddress[]> {
    const addresses =
      await this.checkoutRepository.getUserAddresses(userId);

    return addresses.map(CheckoutMapper.toAddressOption);
  }

  private async createShippingMethods(
    storeId: string,
    city: string,
    options: Awaited<ReturnType<typeof fetchShippingOptions>>,
  ) {
    if (!options.length) {
      throw new NotFoundError(
        "No shipping options available for this checkout",
      );
    }

    const methods =
      await this.checkoutRepository.createShippingMethodSnapshots(
        storeId,
        city,
        options,
      );

    return methods.map(CheckoutMapper.toShippingOption);
  }

  private async getCart(userId: string) {
    const cart =
      await this.checkoutRepository.getCheckoutPreview(userId);

    if (!cart) {
      throw new NotFoundError(CHECKOUT_MESSAGE.CART_EMPTY);
    }

    return cart;
  }

  private getAddress(userId: string, addressId: string) {
    return getAddress(
      this.checkoutRepository,
      userId,
      addressId,
    );
  }

  private selectStore(
    cart: CartRecord,
    address: AddressRecord,
  ) {
    const items = cart.items.map(({ storeProduct, quantity }) => ({
      productId: storeProduct.productId,
      quantity,
    }));

    return this.storeSelectionService.selectStore(
      items,
      address.latitude,
      address.longitude,
    );
  }

  private getTotalWeight(cart: CartRecord): number {
    return cart.items.reduce(
      (total, item) =>
        total +
        item.storeProduct.product.weight * item.quantity,
      0,
    );
  }

  private getShipping(
    payload: CheckoutPreviewRequest,
    storeId: string,
    city: string,
  ) {
    return getShipping(
      this.checkoutRepository,
      payload.shippingMethodId,
      storeId,
      city,
    );
  }

  private getDiscount(
    userId: string,
    payload: CheckoutPreviewRequest,
    cart: CartRecord,
    shippingCost: number,
  ) {
    return calculateCheckoutDiscount(
      this.checkoutRepository,
      userId,
      payload,
      cart,
      shippingCost,
    );
  }
}

