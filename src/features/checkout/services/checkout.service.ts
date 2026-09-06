import { NotFoundError } from "../../../errors/NotFoundError";
import { CheckoutStoreSelectionService } from "./checkout.store-selection.service";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";
import {
  CheckoutAddress,
  CheckoutOptionAddress,
  CheckoutOptionShipping,
  CheckoutPreviewRequest,
  CheckoutShipping,
  CheckoutStore,
} from "../checkout.types";
import { CheckoutMapper } from "../mappers/checkout.mappers";
import { CheckoutRepository } from "../repository/checkout.repository";
import { applyStoreSelection, getAddress, getShipping } from "../helper/checkout.helper";
import { calculateDiscount } from "../utils/checkout.voucher.util";
import { getShippingOptions as fetchShippingOptions } from "../../../integrations/rajaongkir-client";

type CartRecord = NonNullable<Awaited<ReturnType<CheckoutRepository["getCheckoutPreview"]>>>;
type AddressRecord = NonNullable<Awaited<ReturnType<CheckoutRepository["getUserAddress"]>>>;
type StoreRecord = CartRecord["items"][number]["storeProduct"]["store"];
type ShippingRecord = NonNullable<Awaited<ReturnType<CheckoutRepository["getShippingMethod"]>>>;
type Selection = Awaited<ReturnType<CheckoutStoreSelectionService["selectStore"]>>;

export class CheckoutService {
  constructor(
    private readonly checkoutRepository = new CheckoutRepository(),
    private readonly storeSelectionService = new CheckoutStoreSelectionService(),
  ) {}

  async getCheckoutPreview(userId: string, payload: CheckoutPreviewRequest) {
    const cart = await this.getCart(userId);
    const address = await this.getAddress(userId, payload.addressId);
    const selection = await this.selectStore(cart, address);
    const selectedCart = applyStoreSelection(cart, selection.storeProducts);
    const shipping = await this.getShipping(payload, selection.store.id, address.city);
    const discount = await this.getDiscount(userId, payload, selectedCart);
    return this.buildPreview(selectedCart, address, selection, shipping, discount);
  }

  async getShippingOptions(
    userId: string,
    addressId: string,
  ): Promise<CheckoutOptionShipping[]> {
    const cart = await this.getCart(userId);
    const address = await this.getAddress(userId, addressId);
    const selection = await this.selectStore(cart, address);
    const weightGram = this.getTotalWeight(cart);
    const options = await this.fetchShippingOptions(
      selection.store.rajaOngkirCityId,
      address.rajaOngkirCityId,
      weightGram,
    );

    if (!options.length) {
      throw new NotFoundError(
        "No shipping options available for this checkout",
      );
    }

    const methods =
      await this.checkoutRepository.createShippingMethodSnapshots(
        selection.store.id,
        address.city,
        options,
      );

    return methods.map(CheckoutMapper.toShippingOption);
  }

  async getCheckoutAddresses(userId: string): Promise<CheckoutOptionAddress[]> {
    const addresses = await this.checkoutRepository.getUserAddresses(userId);
    return addresses.map(CheckoutMapper.toAddressOption);
  }

  private async getCart(userId: string) {
    const cart = await this.checkoutRepository.getCheckoutPreview(userId);
    if (!cart) throw new NotFoundError(CHECKOUT_MESSAGE.CART_EMPTY);
    return cart;
  }

  private getAddress(userId: string, addressId: string) {
    return getAddress(this.checkoutRepository, userId, addressId);
  }

  private selectStore(cart: CartRecord, address: AddressRecord) {
    const items = cart.items.map(({ storeProduct, quantity }) => ({
      productId: storeProduct.productId,
      quantity,
    }));
    return this.storeSelectionService.selectStore(items, address.latitude, address.longitude);
  }

  private getTotalWeight(cart: CartRecord): number {
    return cart.items.reduce(
      (total, item) =>
        total + item.storeProduct.product.weight * item.quantity,
      0,
    );
  }

  private fetchShippingOptions(
    originCityId: string,
    destinationCityId: string,
    weightGram: number,
  ) {
    return fetchShippingOptions(
      originCityId,
      destinationCityId,
      weightGram,
    );
  }

  private getShipping(payload: CheckoutPreviewRequest, storeId: string, city: string) {
    return getShipping(this.checkoutRepository, payload.shippingMethodId, storeId, city);
  }

  private getDiscount(userId: string, payload: CheckoutPreviewRequest, cart: CartRecord) {
    return calculateDiscount(this.checkoutRepository, userId, payload.userVoucherId, cart.items);
  }

  private buildPreview(
    cart: CartRecord,
    address: AddressRecord,
    selection: Selection,
    shipping: ShippingRecord,
    discount: Awaited<ReturnType<typeof calculateDiscount>>,
  ) {
    return CheckoutMapper.toCheckoutPreview(cart, {
      address: mapAddress(address),
      store: mapStore(selection.store, selection.distanceKm),
      shipping: CheckoutMapper.toShipping(shipping),
      discount,
    });
  }
}

function mapAddress(address: AddressRecord): CheckoutAddress {
  return {
    id: address.id,
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    province: address.province,
    city: address.city,
    district: address.district,
    fullAddress: address.fullAddress,
    latitude: address.latitude,
    longitude: address.longitude,
  };
}

function mapStore(store: StoreRecord, distanceKm: number): CheckoutStore {
  return {
    id: store.id,
    name: store.name,
    code: store.code,
    distanceKm: Number(distanceKm.toFixed(2)),
  };
}
