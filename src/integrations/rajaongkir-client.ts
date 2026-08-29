import axios from "axios";
import { RAJAONGKIR_API_KEY, RAJAONGKIR_BASE_URL } from "../configs/env-config";

export interface ShippingOption {
  courierCode: string;
  serviceCode: string;
  serviceName: string;
  cost: number;
  etd: string;
}

export interface RajaOngkirDestination {
  id: number;
  label: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  zipCode: string;
}

export async function searchCities(
  keyword: string,
): Promise<RajaOngkirDestination[]> {
  const { data } = await axios.get(
    `${RAJAONGKIR_BASE_URL}/destination/domestic-destination`,
    {
      headers: { key: RAJAONGKIR_API_KEY },
      params: { search: keyword, limit: 20, offset: 0 },
      timeout: 5000,
    },
  );
  
  return (data?.data ?? []).map((d: any) => ({
    id: d.id,
    label: d.label,
    province: d.province_name,
    city: d.city_name,
    district: d.district_name,
    subdistrict: d.subdistrict_name,
    zipCode: d.zip_code,
  }));
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
    `${RAJAONGKIR_BASE_URL}/calculate/domestic-cost`,
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
