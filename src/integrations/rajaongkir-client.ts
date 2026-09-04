// import axios from "axios";
// import { RAJAONGKIR_API_KEY, RAJAONGKIR_BASE_URL } from "../configs/env-config";

// export interface ShippingOption {
//   courierCode: string;
//   serviceCode: string;
//   serviceName: string;
//   cost: number;
//   etd: string;
// }

// export interface RajaOngkirDestination {
//   id: number;
//   label: string;
//   province: string;
//   city: string;
//   district: string;
//   subdistrict: string;
//   zipCode: string;
// }

// export async function searchCities(
//   keyword: string,
// ): Promise<RajaOngkirDestination[]> {
//   const { data } = await axios.get(
//     `${RAJAONGKIR_BASE_URL}/destination/domestic-destination`,
//     {
//       headers: { key: RAJAONGKIR_API_KEY },
//       params: { search: keyword, limit: 20, offset: 0 },
//       timeout: 5000,
//     },
//   );
  
//   return (data?.data ?? []).map((d: any) => ({
//     id: d.id,
//     label: d.label,
//     province: d.province_name,
//     city: d.city_name,
//     district: d.district_name,
//     subdistrict: d.subdistrict_name,
//     zipCode: d.zip_code,
//   }));
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
//     `${RAJAONGKIR_BASE_URL}/calculate/domestic-cost`,
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

const DEFAULT_COURIERS = ["jne", "jnt", "tiki", "pos"];

function getHeaders() {
  return {
    key: RAJAONGKIR_API_KEY,
  };
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
    (response.data?.data as
      | RajaOngkirDestinationResponse[]
      | undefined) ?? [];

  return results.map(mapDestination);
}

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
    (response.data?.data as
      | RajaOngkirShippingResponse[]
      | undefined) ?? [];

  return results.map((item) => ({
    courierCode: item.code,
    serviceCode: item.service,
    serviceName: `${item.name} - ${item.service}`,
    cost: Number(item.cost),
    etd: item.etd ?? "-",
  }));
}