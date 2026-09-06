import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { NotFoundError } from "../../errors/NotFoundError";
import { getDistanceKm } from "../../utils/distance";
import { DEFAULT_PROMOTION_LIMIT } from "./storefront.constant";
import type {
  getNearestStoreSchema,
  getPromotionsSchema,
} from "./storefront.validation";

export class StorefrontService {
  /**
   * Menentukan toko terdekat dari koordinat user.
   * Kalau lat/lng tidak dikirim (user menolak izin lokasi), fallback ke
   * toko utama (toko paling lama dibuat) sesuai requirement.
   *
   * TODO: idealnya "toko utama" ditandai eksplisit lewat kolom `isDefault`
   * di tabel Store, bukan diasumsikan dari `createdAt` paling awal.
   * Perlu didiskusikan dengan pemegang Store Management kalau mau diubah.
   */
  static async getNearestStore({ query }: getNearestStoreSchema) {
    const { lat, lng } = query;

    const stores = await prisma.store.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });

    if (stores.length === 0) {
      throw new NotFoundError("No active store is available");
    }

    if (lat === undefined || lng === undefined) {
      const [defaultStore] = stores;
      return {
        store: defaultStore,
        distanceKm: null,
        isInRange: true,
        isDefault: true,
      };
    }

    const nearest = stores
      .map((store) => ({
        store,
        distanceKm: getDistanceKm(lat, lng, store.latitude, store.longitude),
      }))
      .reduce((closest, current) =>
        current.distanceKm < closest.distanceKm ? current : closest,
      );

    return {
      store: nearest.store,
      distanceKm: Number(nearest.distanceKm.toFixed(2)),
      isInRange: nearest.distanceKm <= nearest.store.maxServiceRadiusKm,
      isDefault: false,
    };
  }

  /**
   * Kategori bersifat global (tidak per-toko) karena semua toko menjual
   * katalog produk yang sama — sesuai requirement "toko di lokasi lain
   * merupakan cabang". Jumlahnya biasanya kecil, jadi sengaja tidak
   * dipaginasi seperti list produk/order.
   */
  static async getCategories() {
    return prisma.productCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  }

  /**
   * Promo aktif untuk ditampilkan di hero carousel landing page.
   */
  static async getPromotions({ query }: getPromotionsSchema) {
    const { storeId } = query;
    const now = new Date();

    const where: Prisma.DiscountWhereInput = {
      isActive: true,
      deletedAt: null,
      startDate: { lte: now },
      endDate: { gte: now },
      ...(storeId && { storeId }),
    };

    return prisma.discount.findMany({
      where,
      take: DEFAULT_PROMOTION_LIMIT,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, images: true } },
      },
    });
  }
}
