import { NotFoundError } from "../../../errors/NotFoundError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";
import { CheckoutPreviewRequest } from "../checkout.types";
import { CheckoutMapper } from "../mappers/checkout.mappers";
import { CheckoutRepository } from "../repository/checkout.repository";
import {
  CheckoutAddress,
  CheckoutStore,
  CheckoutShipping,
} from "../checkout.types";
import { calculateDiscount } from "../utils/checkout.voucher.util";
import {
  getAddress,
  getFirstStore,
  getShipping,
  validateStock,
  validateStoreDistance,
} from "../helper/checkout.helper";

export class CheckoutService {
  constructor(private readonly checkoutRepository = new CheckoutRepository()) {}

  async getCheckoutPreview(userId: string, payload: CheckoutPreviewRequest) {
    const cart = await this.checkoutRepository.getCheckoutPreview(userId);
    if (!cart) throw new NotFoundError(CHECKOUT_MESSAGE.CART_EMPTY);
    const store = getFirstStore(cart);
    const address = await getAddress(
      this.checkoutRepository,
      userId,
      payload.addressId,
    );
    const distanceKm = validateStoreDistance(address, store);
    validateStock(cart);
    const shipping = await getShipping(
      this.checkoutRepository,
      payload.shippingMethodId,
      store.id,
      address.city,
    );
    const discount = await calculateDiscount(
      this.checkoutRepository,
      userId,
      payload.userVoucherId,
      cart.items,
    );
    return CheckoutMapper.toCheckoutPreview(cart, {
      address: mapAddress(address),
      store: mapStore(store, distanceKm),
      shipping: mapShipping(shipping),
      discount,
    });
  }
}

type AddressRecord = NonNullable<
  Awaited<ReturnType<CheckoutRepository["getUserAddress"]>>
>;
type StoreRecord = NonNullable<
  Awaited<ReturnType<CheckoutRepository["getCheckoutPreview"]>>
>["items"][number]["storeProduct"]["store"];
type ShippingRecord = NonNullable<
  Awaited<ReturnType<CheckoutRepository["getShippingMethod"]>>
>;

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
