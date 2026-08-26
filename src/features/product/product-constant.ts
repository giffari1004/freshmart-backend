export const PRODUCT_SORT_BY = ["createdAt", "basePrice", "name"] as const;
export const PRODUCT_SORT_ORDER = ["asc", "desc"] as const;
export const PRODUCT_INCLUDE = {
  product: {
    include: {
      category: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
  },
};
