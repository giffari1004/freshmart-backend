import { createMeta } from "../../../helper/createMeta";
import { getPagination } from "../../../helper/getPagination";
import { AuthUser } from "../../../middlewares/auth-middleware";
import {
  queryMonthlyStockSummary,
  queryStockDetail,
  queryStockDetailCount,
  resolveStoreFilter,
} from "../salesreport-stockreport-helper";import {
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
      productImage: row.productImage,
    }));
  }
  static async getStockDetail({ query }: getStockDetailSchema, user: AuthUser) {
    const { storeId, month, page, limit, year, productId } = query;
    const { skip, take } = getPagination(page, limit);
    const resolvedStoreId = resolveStoreFilter(user, storeId);
    const [rows, countResult] = await Promise.all([
      queryStockDetail(resolvedStoreId, year, month, productId, skip, take),
      queryStockDetailCount(resolvedStoreId, year, month, productId), 
    ]);
    const totalData = Number(countResult[0]?.count ?? 0);
    const meta = createMeta(page, limit, totalData);
    return { data: rows, meta };
  }
}
