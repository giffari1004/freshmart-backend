import { ValueType, VoucherUsageType } from "../../../generated/prisma";

export type DiscountType = "DIRECT" | "BUY1GET1" | "MIN_PURCHASE";

export interface DiscountFilterProps {
  type: DiscountType;
  storeId?: string;
  productId?: string;
  activeOnly?: boolean;
}

export interface VourcherFilterProps {
    search?: string | undefined;
    usageType?: VoucherUsageType
    valueType?: ValueType
    isActive?: boolean
}