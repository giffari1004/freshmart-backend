import { AuthUser } from "../../../middlewares/auth-middleware";
import {
  queryMonthlyStockSummary,
  queryStockDetail,
  resolveStoreFilter,
} from "../salesreport-stockreport-helper";
import {
  getMonthlySummarySchema,
  getStockDetailSchema,
} from "./stock-report-validation";

export class StockReportServices {
  static async getMonthlySummary(
    { query }: getMonthlySummarySchema,
    user: AuthUser,
  ) {
    const { storeId, month, year } = query;
    const resolvedStoreId = resolveStoreFilter(user, storeId);
    const rows = await queryMonthlyStockSummary(resolvedStoreId, year, month);
    return rows.map((row) => ({
      month: row.month,
      productId: row.productId,
      productName: row.productName,
      afterStock: Number(row.afterStock),
      stockIn: Number(row.stockIn),
      stockOut: Number(row.stockOut),
    }));
  }
  static async getStockDetail({ query }: getStockDetailSchema, user: AuthUser) {
    const { storeId, month, year, productId } = query;
    const resolvedStoreId = resolveStoreFilter(user,storeId);
    const rows = await queryStockDetail(resolvedStoreId,year,month,productId);
    return rows;
  }
}
