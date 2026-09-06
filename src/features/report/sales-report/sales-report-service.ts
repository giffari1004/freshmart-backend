import { AuthUser } from "../../../middlewares/auth-middleware";
import {
  queryCategoryReport,
  queryMonthReport,
  queryProductReport,
  resolveStoreFilter,
} from "../salesreport-stockreport-helper";
import {
  getCategoryReportSchema,
  getMonthlyReportSchema,
  getProductReportSchema,
} from "./sales-report-validation";

export class SalesReportService {
  static async getMonthlyReport(
    { query }: getMonthlyReportSchema,
    user: AuthUser,
  ) {
    const { storeId, year } = query;
    const resolvedStoreId = resolveStoreFilter(user, storeId);
    const rows = await queryMonthReport(resolvedStoreId, year);
    return rows.map((row) => ({
      month: row.month,
      totalSales: Number(row.totalSales),
      totalOrders: Number(row.totalOrders),
    }));
  }
  static async getProductReport(
    { query }: getProductReportSchema,
    user: AuthUser,
  ) {
    const { storeId, year, month } = query;
    const resolvedStoreId = resolveStoreFilter(user, storeId);
    const rows = await queryProductReport(resolvedStoreId, month , year);
    return rows.map((row) => ({
      month: row.month,
      productId: row.productId,
      productName: row.productName,
      totalSales: Number(row.totalSales),
      quantitySold: Number(row.quantitySold),
    }));
  }
  static async getCategoryReport(
    { query }: getCategoryReportSchema,
    user: AuthUser,
  ) {
    const { storeId, year, month } = query;
    const resolvedStoreId = resolveStoreFilter(user, storeId);
    const rows = await queryCategoryReport(resolvedStoreId, month ,year);
    return rows.map((row) => ({
      month: row.month,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      totalSales: Number(row.totalSales),
    }));
  }
}
