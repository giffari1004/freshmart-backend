export const INVENTORY_SORT_BY = ["createdAt", "stockQuantity"] as const;
export const INVENTORY_SORT_ORDER = ["asc", "desc"] as const;
export const HISTORY_STOCK_SORT_BY = ["createdAt", "quantity"] as const;
export const INVENTORY_SELECT_FIELD = {
  id: true,
  priceOverride: true,
  stockQuantity: true,
  createdAt: true,
  product: {
    select: {
      id: true,
      name: true,
    },
  },
  store: {
    select: {
      id: true,
      name: true,
    },
  },
};
