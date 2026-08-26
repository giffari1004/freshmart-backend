import { NotFoundError } from "../../../errors/NotFoundError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";
import { CheckoutPreviewRequest } from "../checkout.types";
import { CheckoutMapper } from "../mappers/checkout.mappers";
import { CheckoutRepository } from "../repository/checkout.repository";
import { calculateDiscount } from "../utils/checkout.voucher.util";
import {
  getAddress,
  getFirstStore,
  getShipping,
  validateStock,
  validateStoreDistance,
} from "../helper/checkout.helper";
import {
  CheckoutAddress,
  CheckoutShipping,
  CheckoutStore,
} from "../checkout.types";

type CartRecord = NonNullable<
  Awaited<ReturnType<CheckoutRepository["getCheckoutPreview"]>>
>;
type AddressRecord = NonNullable<
  Awaited<ReturnType<CheckoutRepository["getUserAddress"]>>
>;
type StoreRecord = CartRecord["items"][number]["storeProduct"]["store"];
type ShippingRecord = NonNullable<
  Awaited<ReturnType<CheckoutRepository["getShippingMethod"]>>
>;

export class CheckoutService {
  constructor(private readonly checkoutRepository = new CheckoutRepository()) {}

  async getCheckoutPreview(userId: string, payload: CheckoutPreviewRequest) {
    const cart = await this.getCart(userId);
    const store = getFirstStore(cart);
    const address = await this.getAddress(userId, payload.addressId);
    const shipping = await this.getShipping(payload, store.id, address.city);
    const discount = await this.getDiscount(userId, payload, cart);
    validateStock(cart);
    return this.buildPreview(cart, address, store, shipping, discount);
  }

  private async getCart(userId: string) {
    const cart = await this.checkoutRepository.getCheckoutPreview(userId);
    if (!cart) throw new NotFoundError(CHECKOUT_MESSAGE.CART_EMPTY);
    return cart;
  }

  private getAddress(userId: string, addressId: string) {
    return getAddress(this.checkoutRepository, userId, addressId);
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
  ) {
    return calculateDiscount(
      this.checkoutRepository,
      userId,
      payload.userVoucherId,
      cart.items,
    );
  }

  private buildPreview(
    cart: CartRecord,
    address: AddressRecord,
    store: StoreRecord,
    shipping: ShippingRecord,
    discount: Awaited<ReturnType<typeof calculateDiscount>>,
  ) {
    const distanceKm = validateStoreDistance(address, store);
    return CheckoutMapper.toCheckoutPreview(cart, {
      address: mapAddress(address),
      store: mapStore(store, distanceKm),
      shipping: mapShipping(shipping),
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

function mapShipping(shipping: ShippingRecord): CheckoutShipping {
  return {
    id: shipping.id,
    courierCode: shipping.courierCode,
    serviceCode: shipping.serviceCode,
    serviceName: shipping.serviceName,
    cost: Number(shipping.cost),
    etd: shipping.etd,
  };
}
