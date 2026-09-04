import { prisma } from "../../configs/prisma-client-config";
import { geocodeAddress } from "../../integrations/opencage-client";
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
  searchCitiesSchema,
} from "./address.validation";

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
    } = body;

    // Geocoding OpenCage (lat/long) dan rajaOngkirCityId itu DUA HAL
    // BERBEDA yang kebetulan sama-sama soal "kota":
    // - lat/long dari OpenCage -> buat hitung radius jangkauan toko
    // - rajaOngkirCityId -> buat parameter `destination` ke RajaOngkir
    // Dua-duanya wajib disimpan, tidak saling menggantikan.
    const { latitude, longitude } = await geocodeAddress(
      `${fullAddress}, ${district}, ${city}, ${province}`,
    );

    // Alamat pertama user otomatis jadi primary, supaya checkout tidak
    // pernah nemu user yang punya alamat tapi tidak ada satupun primary.
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
    const address = await AddressService.findOwned(userId, params.id);

    const needsRegeocode =
      body.fullAddress !== undefined ||
      body.district !== undefined ||
      body.city !== undefined ||
      body.province !== undefined;

    let coordinates: { latitude: number; longitude: number } | undefined;
    if (needsRegeocode) {
      const merged = { ...address, ...body };
      coordinates = await geocodeAddress(
        `${merged.fullAddress}, ${merged.district}, ${merged.city}, ${merged.province}`,
      );
    }

    return prisma.userAddress.update({
      where: { id: params.id },
      data: { ...body, ...coordinates },
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

    // Transaction supaya "unset semua primary" + "set 1 jadi primary"
    // atomik — tidak ada window waktu di mana user punya 0 atau 2 alamat
    // primary sekaligus.
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

  /**
   * Hitung opsi & biaya pengiriman dari toko ke alamat ini lewat
   * RajaOngkir, lalu simpan tiap opsi sebagai baris BARU di
   * `ShippingMethod` — bukan di-upsert ke baris lama.
   *
   * Ini disengaja: tarif RajaOngkir bisa berubah kapan saja, dan `Order`
   * perlu merujuk ke angka PERSIS yang ditampilkan ke user saat checkout,
   * bukan baris yang nilainya mungkin sudah berubah belakangan.
   */
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

    // DEPENDENSI SCHEMA: `store.rajaOngkirCityId` dan
    // `address.rajaOngkirCityId` belum ada di schema saat ini — baris
    // ini akan gagal type-check sampai kolomnya ditambahkan di kedua
    // model (Store & UserAddress). Setelah itu tidak ada lagi yang perlu
    // diubah di sini.
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

  /**
   * Dipakai frontend untuk autocomplete kota saat mengisi form alamat —
   * hasilnya dipakai untuk isi `city` (nama) sekaligus `rajaOngkirCityId`
   * (ID) di form, bukan diketik bebas.
   */
  static async searchCities(query: string) {
    const destinations = await searchCities(query);
    return destinations.map((d) => ({
      cityId: d.cityId,
      cityName: d.cityName,
      provinceId: d.provinceId,
      province: d.province,
      type: d.type,
      postalCode: d.postalCode,
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
