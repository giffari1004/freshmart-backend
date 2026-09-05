import { prisma } from "../../configs/prisma-client-config";
import {
  getShippingOptions as fetchShippingOptions,
  searchCities,
} from "../../integrations/rajaongkir-client";
import { NotFoundError } from "../../errors/NotFoundError";
import { BadRequestError } from "../../errors/BadRequestError";
import type {
  createAddressSchema,
  updateAddressSchema,
  getAddressByIdSchema,
  deleteAddressSchema,
  setPrimaryAddressSchema,
  getShippingOptionsSchema,
  geocodeCitySchema,
} from "./address.validation";
import { geocodeAddress } from "../../integrations/opencage-client";

export class AddressService {
  static async getAll(userId: string) {
    return prisma.userAddress.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });
  }

  static async getById(userId: string, { params }: getAddressByIdSchema) {
    return AddressService.findOwned(userId, params.id);
  }

  static async create(userId: string, { body }: createAddressSchema) {
    const {
      label,
      recipientName,
      phone,
      province,
      city,
      rajaOngkirCityId,
      district,
      fullAddress,
      isPrimary,
      latitude,
      longitude,
    } = body;

    const existingCount = await prisma.userAddress.count({
      where: { userId, deletedAt: null },
    });
    const shouldBePrimary = isPrimary || existingCount === 0;

    if (shouldBePrimary) {
      await prisma.userAddress.updateMany({
        where: { userId, deletedAt: null },
        data: { isPrimary: false },
      });
    }

    return prisma.userAddress.create({
      data: {
        userId,
        label,
        recipientName,
        phone,
        province,
        city,
        rajaOngkirCityId,
        district,
        fullAddress,
        latitude,
        longitude,
        isPrimary: shouldBePrimary,
      },
    });
  }

  static async update(userId: string, { params, body }: updateAddressSchema) {
    await AddressService.findOwned(userId, params.id);

    return prisma.userAddress.update({
      where: { id: params.id },
      data: body,
    });
  }

  static async delete(userId: string, { params }: deleteAddressSchema) {
    const address = await AddressService.findOwned(userId, params.id);

    if (address.isPrimary) {
      throw new BadRequestError(
        "Cannot delete your primary address. Set another address as primary first.",
      );
    }

    return prisma.userAddress.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
  }

  static async setPrimary(userId: string, { params }: setPrimaryAddressSchema) {
    await AddressService.findOwned(userId, params.id);

    return prisma.$transaction(async (tx) => {
      await tx.userAddress.updateMany({
        where: { userId, deletedAt: null },
        data: { isPrimary: false },
      });

      return tx.userAddress.update({
        where: { id: params.id },
        data: { isPrimary: true },
      });
    });
  }

  static async getShippingOptions(
    userId: string,
    { params, body }: getShippingOptionsSchema,
  ) {
    const address = await AddressService.findOwned(userId, params.id);
    const { storeId, weightGram } = body;

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store || store.deletedAt || !store.isActive) {
      throw new NotFoundError("Store not found");
    }

    const options = await fetchShippingOptions(
      store.rajaOngkirCityId,
      address.rajaOngkirCityId,
      weightGram,
    );

    if (options.length === 0) {
      throw new BadRequestError("No shipping options available for this route");
    }

    return prisma.$transaction(
      options.map((option) =>
        prisma.shippingMethod.create({
          data: {
            storeId,
            destinationCity: address.city,
            courierCode: option.courierCode,
            serviceCode: option.serviceCode,
            serviceName: option.serviceName,
            cost: option.cost,
            etd: option.etd,
          },
        }),
      ),
    );
  }

  static async geocodeCity(query: { query: geocodeCitySchema["query"] }) {
    const { latitude, longitude } = await geocodeAddress(query.query.address);
    return { latitude, longitude };
  }

  static async searchCities(query: string) {
    const destinations = await searchCities(query);
    return destinations.map((d) => ({
      cityId: String(d.id),
      cityName: d.label,
      provinceId: "",
      province: d.province,
      type: d.district,
      postalCode: d.zipCode,
    }));
  }

  private static async findOwned(userId: string, addressId: string) {
    const address = await prisma.userAddress.findUnique({
      where: { id: addressId },
    });

    if (!address || address.deletedAt || address.userId !== userId) {
      throw new NotFoundError("Address not found");
    }

    return address;
  }
}

