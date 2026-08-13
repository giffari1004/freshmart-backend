import { z } from "zod";

export class StorefrontValidation {
  static readonly GET_NEAREST_STORE = z.object({
    query: z
      .object({
        lat: z.coerce.number().min(-90).max(90).optional(),
        lng: z.coerce.number().min(-180).max(180).optional(),
      })
      .refine((data) => (data.lat === undefined) === (data.lng === undefined), {
        message: "lat and lng must be provided together",
      }),
  });

  static readonly GET_PROMOTIONS = z.object({
    query: z.object({
      storeId: z.string().uuid("Invalid store id").optional(),
    }),
  });
}

export type getNearestStoreSchema = z.infer<
  typeof StorefrontValidation.GET_NEAREST_STORE
>;
export type getPromotionsSchema = z.infer<
  typeof StorefrontValidation.GET_PROMOTIONS
>;
