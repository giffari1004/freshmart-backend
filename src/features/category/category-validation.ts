import z from "zod";
import { CATEGORY_SORT_BY, CATEGORY_SORT_ORDER } from "./category-constant";
export class CategoryValidation {
  static readonly CREATE_CATEGORY = z.object({
    body: z.object({
      name: z.string().trim().min(1, "Category name is required"),
    }),
  });
  static readonly UPDATE_CATEGORY = z.object({
    params: z.object({ id: z.string().uuid("Invalid category id") }),
    body: z.object({ name: z.string().trim().min(1).optional() }),
  });
  static readonly GET_ALL_CATEGORY = z.object({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(10),
      search: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.string().trim().optional(),
      ),
      sortBy: z.enum(CATEGORY_SORT_BY).default("createdAt"),
      sortOrder: z.enum(CATEGORY_SORT_ORDER).default("desc"),
    }),
  });
  static readonly DELETE_CATEGORY = z.object({
    params: z.object({ id: z.string().uuid("Invalid category id") }),
  });
}
export type createCategory = z.infer<typeof CategoryValidation.CREATE_CATEGORY>;
export type updateCategory = z.infer<typeof CategoryValidation.UPDATE_CATEGORY>;
export type getAllCategory = z.infer<
  typeof CategoryValidation.GET_ALL_CATEGORY
>;
export type deleteCategory = z.infer<typeof CategoryValidation.DELETE_CATEGORY>;
