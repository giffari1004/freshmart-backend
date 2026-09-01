// import axios from "axios";
// import { RAJAONGKIR_API_KEY, RAJAONGKIR_BASE_URL } from "../configs/env-config";

// export interface ShippingOption {
//   courierCode: string;
//   serviceCode: string;
//   serviceName: string;
//   cost: number;
//   etd: string;
// }

// export interface RajaOngkirCity {
//   cityId: string;
//   cityName: string;
//   provinceId: string;
//   province: string;
//   type: string; // "Kota" | "Kabupaten"
//   postalCode: string;
// }

// // Cache in-memory sederhana untuk daftar kota — RajaOngkir SECARA RESMI
// // mengizinkan (bahkan menganjurkan) hasil `province`/`city`/`subdistrict`
// // di-cache, karena datanya jarang berubah dan tidak boleh di-request
// // berulang tanpa aksi user.
// //
// // Catatan: cache ini reset tiap kali server restart, dan tidak sinkron
// // antar instance kalau nanti di-scale horizontal. Untuk production yang
// // lebih serius, upgrade ke tabel cache di database (butuh migrasi schema
// // terpisah, di luar scope perbaikan ini).
// let cityCache: RajaOngkirCity[] | null = null;
// let cityCacheFetchedAt = 0;
// const CITY_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam

// /**
//  * PENTING: struktur request/response di bawah mengikuti RajaOngkir
//  * "Starter API" versi lama (endpoint `/cost` dan `/city`, courier
//  * dipisah `:`). RajaOngkir sudah beberapa kali ganti versi API (termasuk
//  * migrasi ke Komerce) — CEK ULANG dokumentasi resmi sesuai paket/API key
//  * yang benar-benar dipakai tim sebelum dianggap final.
//  */

// /**
//  * Ambil daftar seluruh kota/kabupaten dari RajaOngkir (di-cache 24 jam).
//  * Dipakai untuk populate dropdown/autocomplete kota di form alamat & toko
//  * — user WAJIB pilih dari daftar ini, bukan input teks bebas, supaya
//  * `cityId` yang tersimpan valid buat dipakai ke endpoint `/cost` nanti.
//  */
// export async function getCities(): Promise<RajaOngkirCity[]> {
//   const isCacheValid =
//     cityCache !== null && Date.now() - cityCacheFetchedAt < CITY_CACHE_TTL_MS;
//   if (isCacheValid) return cityCache as RajaOngkirCity[];

//   const { data } = await axios.get(`${RAJAONGKIR_BASE_URL}/city`, {
//     headers: { key: RAJAONGKIR_API_KEY },
//   });

//   const results = data?.rajaongkir?.results ?? [];
//   cityCache = results.map((city: any) => ({
//     cityId: city.city_id,
//     cityName: city.city_name,
//     provinceId: city.province_id,
//     province: city.province,
//     type: city.type,
//     postalCode: city.postal_code,
//   }));
//   cityCacheFetchedAt = Date.now();

//   return cityCache as RajaOngkirCity[];
// }

// /**
//  * Cari kota berdasarkan keyword (dari cache), buat fitur
//  * autocomplete/search di form alamat.
//  */
// export async function searchCities(keyword: string): Promise<RajaOngkirCity[]> {
//   const cities = await getCities();
//   const lowerKeyword = keyword.toLowerCase();
//   return cities.filter((city) =>
//     city.cityName.toLowerCase().includes(lowerKeyword),
//   );
// }

// /**
//  * Ambil daftar opsi & tarif pengiriman dari RajaOngkir.
//  *
//  * `originCityId`/`destinationCityId` WAJIB berupa city ID milik
//  * RajaOngkir (didapat dari `getCities()`/`searchCities()`), BUKAN nama
//  * kota bebas — endpoint `/cost` RajaOngkir tidak menerima nama kota.
//  */
// export async function getShippingOptions(
//   originCityId: string,
//   destinationCityId: string,
//   weightGram: number,
//   couriers: string[] = ["jne", "pos", "tiki"],
// ): Promise<ShippingOption[]> {
//   const { data } = await axios.post(
//     `${RAJAONGKIR_BASE_URL}/cost`,
//     {
//       origin: originCityId,
//       destination: destinationCityId,
//       weight: weightGram,
//       courier: couriers.join(":"),
//     },
//     { headers: { key: RAJAONGKIR_API_KEY } },
//   );

//   const results = data?.rajaongkir?.results ?? [];

//   return results.flatMap((courierResult: any) =>
//     courierResult.costs.map((service: any) => ({
//       courierCode: courierResult.code,
//       serviceCode: service.service,
//       serviceName: `${courierResult.name} - ${service.service}`,
//       cost: service.cost[0].value,
//       etd: service.cost[0].etd,
//     })),
//   );
// }
import axios from "axios";
import {
  RAJAONGKIR_API_KEY,
  RAJAONGKIR_BASE_URL,
} from "../configs/env-config";

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
  type: string;
  postalCode: string;
}

interface RajaOngkirDestinationResponse {
  id: number;
  label: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  zipCode: string;
}

interface RajaOngkirShippingResponse {
  name: string;
  code: string;
  service: string;
  description?: string;
  cost: number;
  etd?: string;
}

let cityCache: RajaOngkirCity[] | null = null;
let cityCacheFetchedAt = 0;

const CITY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const DEFAULT_COURIERS = ["jne", "jnt", "tiki", "pos"];

function getHeaders() {
  return {
    key: RAJAONGKIR_API_KEY,
  };
}

function getDestinationLabel(item: RajaOngkirDestinationResponse) {
  return item.label || item.city;
}

function mapDestination(
  item: RajaOngkirDestinationResponse,
): RajaOngkirCity {
  return {
    cityId: String(item.id),
    cityName: item.city,
    provinceId: "",
    province: item.province,
    type: "",
    postalCode: item.zipCode,
  };
}

/**
 * Search destination pada RajaOngkir.
 *
 * API terbaru menggunakan endpoint:
 * GET /destination/domestic-destination
 */
export async function searchCities(
  keyword: string,
): Promise<RajaOngkirCity[]> {
  const search = keyword.trim();

  if (!search) {
    return [];
  }

  const response = await axios.get(
    `${RAJAONGKIR_BASE_URL}/destination/domestic-destination`,
    {
      params: {
        search,
        limit: 100,
        offset: 0,
      },
      headers: getHeaders(),
    },
  );

  const results =
    (response.data?.data as RajaOngkirDestinationResponse[] | undefined) ??
    [];

  return results.map(mapDestination);
}

/**
 * getCities dipertahankan untuk kompatibilitas dengan caller lama.
 *
 * Karena API destination terbaru membutuhkan parameter search,
 * gunakan keyword dari env RAJAONGKIR_CITY_SEARCH.
 */
export async function getCities(): Promise<RajaOngkirCity[]> {
  const isCacheValid =
    cityCache !== null &&
    Date.now() - cityCacheFetchedAt < CITY_CACHE_TTL_MS;

  if (isCacheValid) {
    return cityCache as RajaOngkirCity[];
  }

  const defaultSearch =
    process.env.RAJAONGKIR_CITY_SEARCH?.trim() || "bandung";

  cityCache = await searchCities(defaultSearch);
  cityCacheFetchedAt = Date.now();

  return cityCache;
}

/**
 * Ambil shipping options dari RajaOngkir.
 *
 * Endpoint terbaru:
 * POST /calculate/domestic-cost
 *
 * Request body menggunakan x-www-form-urlencoded.
 */
export async function getShippingOptions(
  originCityId: string,
  destinationCityId: string,
  weightGram: number,
  couriers: string[] = DEFAULT_COURIERS,
): Promise<ShippingOption[]> {
  if (weightGram <= 0) {
    return [];
  }

  if (!originCityId || !destinationCityId) {
    return [];
  }

  const params = new URLSearchParams();

  params.append("origin", originCityId);
  params.append("destination", destinationCityId);
  params.append("weight", String(Math.ceil(weightGram)));
  params.append("courier", couriers.join(":"));
  params.append("price", "lowest");

  const response = await axios.post(
    `${RAJAONGKIR_BASE_URL}/calculate/domestic-cost`,
    params.toString(),
    {
      headers: {
        ...getHeaders(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const results =
    (response.data?.data as RajaOngkirShippingResponse[] | undefined) ?? [];

  return results.map((item) => ({
    courierCode: item.code,
    serviceCode: item.service,
    serviceName: `${item.name} - ${item.service}`,
    cost: Number(item.cost),
    etd: item.etd ?? "-",
  }));
}
