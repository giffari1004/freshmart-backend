import { z } from "zod";

export class AddressValidation {
  static readonly CREATE_ADDRESS = z.object({
    body: z.object({
      label: z.string().trim().min(1, "Label is required"),
      recipientName: z.string().trim().min(1, "Recipient name is required"),
      phone: z
        .string()
        .trim()
        .min(8, "Phone number is invalid")
        .max(20, "Phone number is invalid"),
      province: z.string().trim().min(1, "Province is required"),
      city: z.string().trim().min(1, "City is required"),
      rajaOngkirCityId: z.string().trim().min(1, "City ID is required"),
      district: z.string().trim().min(1, "District is required"),
      fullAddress: z.string().trim().min(1, "Full address is required"),
      latitude: z
        .number({ error: "Please pin your exact location on the map" })
        .min(-90)
        .max(90),
      longitude: z
        .number({ error: "Please pin your exact location on the map" })
        .min(-180)
        .max(180),
      isPrimary: z.boolean().optional().default(false),
    }),
  });

  static readonly UPDATE_ADDRESS = z.object({
    params: z.object({ id: z.string().uuid("Invalid address id") }),
    body: z.object({
      label: z.string().trim().min(1).optional(),
      recipientName: z.string().trim().min(1).optional(),
      phone: z.string().trim().min(8).max(20).optional(),
      province: z.string().trim().min(1).optional(),
      city: z.string().trim().min(1).optional(),
      rajaOngkirCityId: z.string().trim().min(1).optional(),
      district: z.string().trim().min(1).optional(),
      fullAddress: z.string().trim().min(1).optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    }),
  });

  static readonly GEOCODE_CITY = z.object({
    query: z.object({
      address: z.string().trim().min(1, "Address text is required"),
    }),
  });

  static readonly GET_ADDRESS_BY_ID = z.object({
    params: z.object({ id: z.string().uuid("Invalid address id") }),
  });

  static readonly DELETE_ADDRESS = z.object({
    params: z.object({ id: z.string().uuid("Invalid address id") }),
  });

  static readonly SET_PRIMARY_ADDRESS = z.object({
    params: z.object({ id: z.string().uuid("Invalid address id") }),
  });

  static readonly GET_SHIPPING_OPTIONS = z.object({
    params: z.object({ id: z.string().uuid("Invalid address id") }),
    body: z.object({
      storeId: z.string().uuid("Invalid store id"),
      weightGram: z.coerce
        .number()
        .int()
        .positive("Weight must be greater than 0"),
    }),
  });

  static readonly SEARCH_CITIES = z.object({
    query: z.object({
      search: z.string().trim().min(2, "Type at least 2 characters"),
    }),
  });
}

export type createAddressSchema = z.infer<
  typeof AddressValidation.CREATE_ADDRESS
>;
export type updateAddressSchema = z.infer<
  typeof AddressValidation.UPDATE_ADDRESS
>;
export type getAddressByIdSchema = z.infer<
  typeof AddressValidation.GET_ADDRESS_BY_ID
>;
export type deleteAddressSchema = z.infer<
  typeof AddressValidation.DELETE_ADDRESS
>;
export type setPrimaryAddressSchema = z.infer<
  typeof AddressValidation.SET_PRIMARY_ADDRESS
>;
export type getShippingOptionsSchema = z.infer<
  typeof AddressValidation.GET_SHIPPING_OPTIONS
>;
export type searchCitiesSchema = z.infer<
  typeof AddressValidation.SEARCH_CITIES
>;
export type geocodeCitySchema = z.infer<typeof AddressValidation.GEOCODE_CITY>;