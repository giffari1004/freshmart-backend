import { calculateDiscountSchema } from "./discount-calculate-validation";
import {
  calculateCartTotal,
  getMinPurchaseDiscount,
  getPerItemDiscounts,
} from "./discount-calculate-helper";

export class DiscountCalculateService {
  static async calculate({ body }: calculateDiscountSchema) {
    const { storeId, cartItems } = body;
    const totalAmount = calculateCartTotal(cartItems);
    const perItemDiscounts = await getPerItemDiscounts(storeId, cartItems);
    const minPurchaseDiscount = await getMinPurchaseDiscount(
      storeId,
      totalAmount,
    );
    const discounts = minPurchaseDiscount
      ? [...perItemDiscounts, minPurchaseDiscount]
      : perItemDiscounts;
    const totalDiscount = discounts.reduce(
      (sum, d) => sum + d.discountAmount,
      0,
    );
    const finalAmount = totalAmount - totalDiscount;
    return { totalAmount, totalDiscount, finalAmount, discounts };
  }
}
