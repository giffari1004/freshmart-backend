import { NotFoundError } from "../../../errors/NotFoundError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";
import { CheckoutRepository } from "../repository/checkout.repository";

type CheckoutCart = NonNullable<
  Awaited<ReturnType<CheckoutRepository["getCheckoutPreview"]>>
>;
type CheckoutStoreProduct = CheckoutCart["items"][number]["storeProduct"];

export async function getAddress(
  repository: CheckoutRepository,
  userId: string,
  addressId: string,
) {
  const address = await repository.getUserAddress(userId, addressId);
  if (!address) throw new NotFoundError(CHECKOUT_MESSAGE.ADDRESS_NOT_FOUND);
  return address;
}

export function applyStoreSelection(
  cart: CheckoutCart,
  storeProducts: CheckoutStoreProduct[],
): CheckoutCart {
  const selected = new Map(storeProducts.map((item) => [item.productId, item]));
  const items = cart.items.map((item) => ({
    ...item,
    storeProduct: selected.get(item.storeProduct.productId) ?? item.storeProduct,
  }));
  return { ...cart, items };
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
  if (!shipping) {
    throw new NotFoundError(CHECKOUT_MESSAGE.SHIPPING_METHOD_INVALID);
  }
  return shipping;
}
