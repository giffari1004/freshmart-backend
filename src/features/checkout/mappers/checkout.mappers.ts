import { Prisma } from "../../../../generated/prisma";
import {
  CheckoutAddress,
  CheckoutDiscount,
  CheckoutItem,
  CheckoutOptionAddress,
  CheckoutOptionShipping,
  CheckoutPreviewResponse,
  CheckoutShipping,
  CheckoutStore,
} from "../checkout.types";
import { toCheckoutItem } from "./checkout.item.mapper";

type CheckoutCart = Prisma.CartGetPayload<{
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
          },
        },
      },
    },
  },
}>;

type ShippingMethod = Prisma.ShippingMethodGetPayload<object>;
type AddressRecord = Prisma.UserAddressGetPayload<object>;
type StoreRecord = Prisma.StoreGetPayload<object>;

interface CheckoutPreviewData {
  address: CheckoutAddress;
  store: CheckoutStore;
  shipping: CheckoutShipping;
  discount: CheckoutDiscount;
}

export class CheckoutMapper {
  static toShippingOption(
    method: ShippingMethod,
  ): CheckoutOptionShipping {
    return {
      id: method.id,
      courierCode: method.courierCode,
      serviceCode: method.serviceCode,
      serviceName: method.serviceName,
      cost: Number(method.cost),
      etd: method.etd,
    };
  }

  static toAddressOption(
    address: AddressRecord,
  ): CheckoutOptionAddress {
    return {
      id: address.id,
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      fullAddress: address.fullAddress,
      isPrimary: address.isPrimary,
    };
  }

  static toAddress(
    address: AddressRecord,
  ): CheckoutAddress {
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

  static toStore(
    store: StoreRecord,
    distanceKm: number,
  ): CheckoutStore {
    return {
      id: store.id,
      name: store.name,
      code: store.code,
      distanceKm,
    };
  }

  static toShipping(
    shipping: ShippingMethod,
  ): CheckoutShipping {
    return {
      id: shipping.id,
      courierCode: shipping.courierCode,
      serviceCode: shipping.serviceCode,
      serviceName: shipping.serviceName,
      cost: Number(shipping.cost),
      etd: shipping.etd,
    };
  }

  static toCheckoutPreview(
    cart: CheckoutCart,
    data: CheckoutPreviewData,
  ): CheckoutPreviewResponse {
    const items = cart.items.map(toCheckoutItem);

    return buildPreview(items, data);
  }
}

function buildPreview(
  items: CheckoutItem[],
  data: CheckoutPreviewData,
): CheckoutPreviewResponse {
  const subtotal = sum(items, "subtotal");

  return {
    items,
    totalItems: sum(items, "quantity"),
    totalWeight: sum(items, "weight"),
    subtotal,
    discount: data.discount,
    shipping: data.shipping,
    totalAmount:
      subtotal -
      data.discount.amount +
      data.shipping.cost,
    address: data.address,
    store: data.store,
  };
}

function sum(
  items: CheckoutItem[],
  key: "quantity" | "weight" | "subtotal",
): number {
  return items.reduce(
    (total, item) => total + item[key],
    0,
  );
}