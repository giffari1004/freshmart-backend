import { BadRequestError } from "../../../errors/BadRequestError";
import { NotFoundError } from "../../../errors/NotFoundError";
import { CHECKOUT_MESSAGE } from "../constants/checkout.constant";
import { CheckoutMapper } from "../mappers/checkout.mappers";
import { CheckoutRepository } from "../repository/checkout.repository";
import { CheckoutPreviewRequest } from "../checkout.types";
import { calculateDistanceKm, isWithinServiceRadius } from "../utils/checkout.distance.util";
import { validateCheckoutStock } from "../utils/checkout.stock.util";
import { validateSingleStore } from "../utils/checkout.store.util";
import { calculateDiscount } from "../utils/checkout.voucher.util";

export class CheckoutService {
  constructor(
    private readonly checkoutRepository =
      new CheckoutRepository(),
  ) {}

  async getCheckoutPreview(
    userId: string,
    payload: CheckoutPreviewRequest,
  ) {
    const cart =
      await this.checkoutRepository.getCheckoutPreview(
        userId,
      );

    if (!cart || cart.items.length === 0) {
      throw new NotFoundError(
        CHECKOUT_MESSAGE.CART_EMPTY,
      );
    }

    const firstItem = cart.items[0];

    if (!firstItem) {
      throw new NotFoundError(
        CHECKOUT_MESSAGE.CART_EMPTY,
      );
    }

    const store =
      firstItem.storeProduct.store;

    if (!store.isActive) {
      throw new BadRequestError(
        CHECKOUT_MESSAGE.STORE_NOT_FOUND,
      );
    }

    validateSingleStore(
      cart.items,
      store.id,
    );

    const address =
      await this.checkoutRepository.getUserAddress(
        userId,
        payload.addressId,
      );

    if (!address) {
      throw new NotFoundError(
        CHECKOUT_MESSAGE.ADDRESS_NOT_FOUND,
      );
    }

    const distanceKm =
      calculateDistanceKm(
        address.latitude,
        address.longitude,
        store.latitude,
        store.longitude,
      );

    if (
      !isWithinServiceRadius(
        distanceKm,
        store.maxServiceRadiusKm,
      )
    ) {
      throw new BadRequestError(
        CHECKOUT_MESSAGE.STORE_OUT_OF_RADIUS,
      );
    }

    validateCheckoutStock(
      cart.items,
    );

    const shippingMethod =
      await this.checkoutRepository.getShippingMethod(
        payload.shippingMethodId,
        store.id,
        address.city,
      );

    if (!shippingMethod) {
      throw new NotFoundError(
        CHECKOUT_MESSAGE.SHIPPING_METHOD_INVALID,
      );
    }

    const discount =
      await calculateDiscount(
        this.checkoutRepository,
        userId,
        payload.userVoucherId,
        cart.items,
      );

    return CheckoutMapper.toCheckoutPreview(
      cart,
      {
        address: {
          id: address.id,
          label: address.label,
          recipientName:
            address.recipientName,
          phone: address.phone,
          province: address.province,
          city: address.city,
          district: address.district,
          fullAddress:
            address.fullAddress,
          latitude:
            address.latitude,
          longitude:
            address.longitude,
        },

        store: {
          id: store.id,
          name: store.name,
          code: store.code,
          distanceKm: Number(
            distanceKm.toFixed(2),
          ),
        },

        shipping: {
          id: shippingMethod.id,
          courierCode:
            shippingMethod.courierCode,
          serviceCode:
            shippingMethod.serviceCode,
          serviceName:
            shippingMethod.serviceName,
          cost: Number(
            shippingMethod.cost,
          ),
          etd: shippingMethod.etd,
        },

        discount,
      },
    );
  }
  
}