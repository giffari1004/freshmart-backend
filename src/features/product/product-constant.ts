
export const PRODUCT_SORT_BY = ["createdAt", "basePrice", "name"] as const;
export const PRODUCT_SORT_ORDER = ["asc", "desc"] as const;
export function getProductInclude() {
  const now = new Date()
  return  {
  product: {
    include: {
      images: { orderBy: { isPrimary: "desc" as const}},
      category: true,
      discounts: {
        where: {
          deletedAt: null,
          isActive:true,
          startDate: {lte: now},
          endDate: {gte: now}
        },
      select: {type:true, valueType:true,value:true}
      }
    },
  },
}
}