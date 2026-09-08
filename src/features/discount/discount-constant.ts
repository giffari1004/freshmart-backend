import { ValueType, VoucherUsageType } from "../../../generated/prisma";
import { AuthUser } from "../../middlewares/auth-middleware";

export type DiscountType = "DIRECT" | "BUY1GET1" | "MIN_PURCHASE";

export interface DiscountFilterProps {
  user: AuthUser
  type: DiscountType;
  storeId?: string;
  productId?: string;
  activeOnly?: boolean;
}

export interface DiscountDuplicateProps {
  type: DiscountType;
  storeId?: string;
  productId?: string;
}

export interface VourcherFilterProps {
    user:AuthUser,
    search?: string | undefined;
    usageType?: VoucherUsageType
    valueType?: ValueType
    isActive?: boolean
    storeId?: string
}

export interface ExistingDiscountProps {
  id:string
  type:DiscountType
}