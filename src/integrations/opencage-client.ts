import axios from "axios";
import { OPENCAGE_API_KEY } from "../configs/env-config";

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

/**
 * Geocode alamat teks jadi koordinat lat/lng lewat OpenCage.
 * Dipakai di features/address karena UserAddress.latitude/longitude
 * bersifat wajib (non-nullable) di schema — alamat tidak boleh tersimpan
 * tanpa koordinat valid.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const { data } = await axios.get(
    "https://api.opencagedata.com/geocode/v1/json",
    {
      params: {
        q: address,
        key: OPENCAGE_API_KEY,
        limit: 1,
        no_annotations: 1,
        countrycode: "id",
      },
    },
  );

  const result = data?.results?.[0];
  if (!result) {
    throw new Error(`Could not find coordinates for address: "${address}"`);
  }

  return { latitude: result.geometry.lat, longitude: result.geometry.lng };
}
