import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { UnAuthorizedError } from "../../errors/UnauthorizedError";
import { AuthUser } from "../../middlewares/auth-middleware";
export const CONFIRMED_STATUS = "CONFIRMED";
export function resolveStoreFilter(user: AuthUser, storeId?: string) {
  if (user.role === "SUPER_ADMIN") return storeId;
  if (user.role === "STORE_ADMIN" && !user.storeId) {
    throw new UnAuthorizedError("Store admin is not assigned to a store");
  }
  return user.storeId ?? undefined;
}
export function queryMonthReport(storeId?: string, year?: number) {
  return prisma.$queryRaw<
    { month: Date; totalSales: string; totalOrders: string }[]
  >`
    SELECT
      date_trunc('month', "createdAt") AS month,
      SUM("totalAmount") AS "totalSales",
      COUNT(*) AS "totalOrders"
    FROM "orders"
    WHERE "status" = ${CONFIRMED_STATUS}::"OrderStatus"
      ${storeId ? Prisma.sql`AND "storeId" = ${storeId}` : Prisma.empty}
      ${year ? Prisma.sql`AND EXTRACT(YEAR FROM "createdAt") = ${year}` : Prisma.empty}
    GROUP BY month
    ORDER BY month ASC
  `;
}
export function queryProductReport(
  storeId?: string,
  month?: number,
  year?: number,
) {
  return prisma.$queryRaw<
    {
      month: Date;
      totalSales: string;
      productName: string;
      quantitySold: string;
      productId: string;
    }[]
  >`SELECT
      date_trunc('month', o."createdAt") AS month,
      p."id" AS "productId",
      p."name" AS "productName",
      SUM(oi."subtotal") AS "totalSales",
      SUM(oi."quantity") AS "quantitySold"
    FROM "order_items" oi
    JOIN "orders" o ON o."id" = oi."orderId"
    JOIN "products" p ON p."id" = oi."productId"
    WHERE o."status" = ${CONFIRMED_STATUS}::"OrderStatus"
      ${storeId ? Prisma.sql`AND o."storeId" = ${storeId}` : Prisma.empty}
      ${year ? Prisma.sql`AND EXTRACT(YEAR FROM o."createdAt") = ${year}` : Prisma.empty}
      ${month ? Prisma.sql`AND EXTRACT(MONTH FROM o."createdAt") = ${month}` : Prisma.empty}
    GROUP BY month, p."id", p."name"
    ORDER BY month ASC, "totalSales" DESC`;
}

export function queryCategoryReport(
  storeId?: string,
  month?: number,
  year?: number,
) {
  return prisma.$queryRaw<
    {
      month: Date;
      totalSales: string;
      categoryId: string;
      categoryName: string;
    }[]
  >`    SELECT
      date_trunc('month', o."createdAt") AS month,
      pc."id" AS "categoryId",
      pc."name" AS "categoryName",
      SUM(oi."subtotal") AS "totalSales"
    FROM "order_items" oi
    JOIN "orders" o ON o."id" = oi."orderId"
    JOIN "products" p ON p."id" = oi."productId"
    JOIN "product_categories" pc ON pc."id" = p."categoryId"
    WHERE o."status" = ${CONFIRMED_STATUS}::"OrderStatus"
      ${storeId ? Prisma.sql`AND o."storeId" = ${storeId}` : Prisma.empty}
      ${year ? Prisma.sql`AND EXTRACT(YEAR FROM o."createdAt") = ${year}` : Prisma.empty}
      ${month ? Prisma.sql`AND EXTRACT(MONTH FROM o."createdAt") = ${month}` : Prisma.empty}
    GROUP BY month, pc."id", pc."name"
    ORDER BY month ASC, "totalSales" DESC`;
}

export function queryMonthlyStockSummary(
  storeId?: string,
  year?: number,
  month?: number,
) {
  return prisma.$queryRaw<
    {
      month: Date;
      productId: string;
      productName: string;
      stockIn: string;
      stockOut: string;
      afterStock: string;
    }[]
  >`
  SELECT 
  date_trunc('month',sj."createdAt") AS month,
  p."id" AS "productId",
  p."name" AS "productName",
  SUM(CASE WHEN sj."type" = 'IN' THEN sj."quantity" ELSE 0 END) AS "stockIn",
  SUM(CASE WHEN sj."type" = 'OUT' THEN sj."quantity" ELSE 0 END) AS "stockOut",
  MAX(sj."afterStock") AS  "afterStock"
  FROM "stock_journals" sj
  JOIN "store_products" sp ON sp."id" = sj."storeProductId"
  JOIN "products" p ON p."id" = sp."productId"
  WHERE 1=1
  ${storeId ? Prisma.sql`AND sp."storeId" = ${storeId}` : Prisma.empty}
  ${year ? Prisma.sql`AND EXTRACT(YEAR FROM sj."createdAt")= ${year}` : Prisma.empty}
  ${month ? Prisma.sql`AND EXTRACT(MONTH FROM sj."createdAt") = ${month}` : Prisma.empty}
  GROUP BY month , p."id" , p."name"
  ORDER BY month ASC , p."name" ASC`;
}

export function queryStockDetail(
  storeId?: string,
  year?: number,
  month?: number,
  productId?: string,
) {
  return prisma.$queryRaw<
    {
      id: string;
      productName: string;
      createdAt: Date;
      type: string;
      quantity: number;
      beforeStock: number;
      afterStock: number;
      notes: string | null;
    }[]
  >`
  SELECT
   sj."id",
      sj."createdAt",
      sj."type",
      sj."quantity",
      sj."beforeStock",
      sj."afterStock",
      sj."notes",
      p."name" AS "productName"
      FROM "stock_journals" sj
      JOIN "store_products" sp ON sp."id" = sj."storeProductId"
      JOIN "products" p ON p."id" = sp."productId"
      WHERE EXTRACT(YEAR FROM sj."createdAt") = ${year}
      AND EXTRACT(MONTH FROM sj."createdAt") = ${month}
      ${storeId ? Prisma.sql`AND sp."storeId" = ${storeId}` : Prisma.empty}
      ${productId ? Prisma.sql`AND sp."productId" = ${productId}` : Prisma.empty}
      ORDER BY sj."createdAt" DESC`;
}
