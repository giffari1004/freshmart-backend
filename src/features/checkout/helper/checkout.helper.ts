import { BadRequestError } from "../../../errors/BadRequestError";
import { NotFoundError } from "../../../errors/NotFoundError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";
import { CheckoutRepository } from "../repository/checkout.repository";
import {
  calculateDistanceKm,
  isWithinServiceRadius,
} from "../utils/checkout.distance.util";
import { validateCheckoutStock } from "../utils/checkout.stock.util";
import { validateSingleStore } from "../utils/checkout.store.util";

type CheckoutCart = NonNullable<
  Awaited<ReturnType<CheckoutRepository["getCheckoutPreview"]>>
>;
type CheckoutAddressRecord = NonNullable<
  Awaited<ReturnType<CheckoutRepository["getUserAddress"]>>
>;
type CheckoutStoreRecord =
  CheckoutCart["items"][number]["storeProduct"]["store"];

export function getFirstStore(cart: CheckoutCart): CheckoutStoreRecord {
  if (!cart?.items.length) throw new NotFoundError(CHECKOUT_MESSAGE.CART_EMPTY);
  const item = cart.items[0];
  if (!item || !item.storeProduct.store.isActive)
    throw new BadRequestError(CHECKOUT_MESSAGE.STORE_NOT_FOUND);
  validateSingleStore(cart.items, item.storeProduct.store.id);
  return item.storeProduct.store;
}

export async function getAddress(
  repository: CheckoutRepository,
  userId: string,
  addressId: string,
) {
  const address = await repository.getUserAddress(userId, addressId);
  if (!address) throw new NotFoundError(CHECKOUT_MESSAGE.ADDRESS_NOT_FOUND);
  return address;
}

export function validateStoreDistance(
  address: CheckoutAddressRecord,
  store: CheckoutStoreRecord,
): number {
  const distanceKm = calculateDistanceKm(
    address.latitude,
    address.longitude,
    store.latitude,
    store.longitude,
  );
  if (!isWithinServiceRadius(distanceKm, store.maxServiceRadiusKm))
    throw new BadRequestError(CHECKOUT_MESSAGE.STORE_OUT_OF_RADIUS);
  return distanceKm;
}

export function validateStock(cart: CheckoutCart): void {
  validateCheckoutStock(cart.items);
}

export async function getShipping(
  repository: CheckoutRepository,
  shippingMethodId: string,
  storeId: string,
  city: string,
) {
  const shipping = await repository.getShippingMethod(
    shippingMethodId,
    storeId,
    city,
  );
  if (!shipping)
    throw new NotFoundError(CHECKOUT_MESSAGE.SHIPPING_METHOD_INVALID);
  return shipping;
}
