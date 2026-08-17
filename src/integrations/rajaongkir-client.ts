import axios from "axios";
import { RAJAONGKIR_API_KEY, RAJAONGKIR_BASE_URL } from "../configs/env-config";

export interface ShippingOption {
  courierCode: string;
  serviceCode: string;
  serviceName: string;
  cost: number;
  etd: string;
}

export interface RajaOngkirCity {
  cityId: string;
  cityName: string;
  provinceId: string;
  province: string;
  type: string; // "Kota" | "Kabupaten"
  postalCode: string;
}

// Cache in-memory sederhana untuk daftar kota — RajaOngkir SECARA RESMI
// mengizinkan (bahkan menganjurkan) hasil `province`/`city`/`subdistrict`
// di-cache, karena datanya jarang berubah dan tidak boleh di-request
// berulang tanpa aksi user.
//
// Catatan: cache ini reset tiap kali server restart, dan tidak sinkron
// antar instance kalau nanti di-scale horizontal. Untuk production yang
// lebih serius, upgrade ke tabel cache di database (butuh migrasi schema
// terpisah, di luar scope perbaikan ini).
let cityCache: RajaOngkirCity[] | null = null;
let cityCacheFetchedAt = 0;
const CITY_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam

/**
 * PENTING: struktur request/response di bawah mengikuti RajaOngkir
 * "Starter API" versi lama (endpoint `/cost` dan `/city`, courier
 * dipisah `:`). RajaOngkir sudah beberapa kali ganti versi API (termasuk
 * migrasi ke Komerce) — CEK ULANG dokumentasi resmi sesuai paket/API key
 * yang benar-benar dipakai tim sebelum dianggap final.
 */

/**
 * Ambil daftar seluruh kota/kabupaten dari RajaOngkir (di-cache 24 jam).
 * Dipakai untuk populate dropdown/autocomplete kota di form alamat & toko
 * — user WAJIB pilih dari daftar ini, bukan input teks bebas, supaya
 * `cityId` yang tersimpan valid buat dipakai ke endpoint `/cost` nanti.
 */
export async function getCities(): Promise<RajaOngkirCity[]> {
  const isCacheValid =
    cityCache !== null && Date.now() - cityCacheFetchedAt < CITY_CACHE_TTL_MS;
  if (isCacheValid) return cityCache as RajaOngkirCity[];

  const { data } = await axios.get(`${RAJAONGKIR_BASE_URL}/city`, {
    headers: { key: RAJAONGKIR_API_KEY },
  });

  const results = data?.rajaongkir?.results ?? [];
  cityCache = results.map((city: any) => ({
    cityId: city.city_id,
    cityName: city.city_name,
    provinceId: city.province_id,
    province: city.province,
    type: city.type,
    postalCode: city.postal_code,
  }));
  cityCacheFetchedAt = Date.now();

  return cityCache as RajaOngkirCity[];
}

/**
 * Cari kota berdasarkan keyword (dari cache), buat fitur
 * autocomplete/search di form alamat.
 */
export async function searchCities(keyword: string): Promise<RajaOngkirCity[]> {
  const cities = await getCities();
  const lowerKeyword = keyword.toLowerCase();
  return cities.filter((city) =>
    city.cityName.toLowerCase().includes(lowerKeyword),
  );
}

/**
 * Ambil daftar opsi & tarif pengiriman dari RajaOngkir.
 *
 * `originCityId`/`destinationCityId` WAJIB berupa city ID milik
 * RajaOngkir (didapat dari `getCities()`/`searchCities()`), BUKAN nama
 * kota bebas — endpoint `/cost` RajaOngkir tidak menerima nama kota.
 */
export async function getShippingOptions(
  originCityId: string,
  destinationCityId: string,
  weightGram: number,
  couriers: string[] = ["jne", "pos", "tiki"],
): Promise<ShippingOption[]> {
  const { data } = await axios.post(
    `${RAJAONGKIR_BASE_URL}/cost`,
    {
      origin: originCityId,
      destination: destinationCityId,
      weight: weightGram,
      courier: couriers.join(":"),
    },
    { headers: { key: RAJAONGKIR_API_KEY } },
  );

  const results = data?.rajaongkir?.results ?? [];

  return results.flatMap((courierResult: any) =>
    courierResult.costs.map((service: any) => ({
      courierCode: courierResult.code,
      serviceCode: service.service,
      serviceName: `${courierResult.name} - ${service.service}`,
      cost: service.cost[0].value,
      etd: service.cost[0].etd,
    })),
  );
}
