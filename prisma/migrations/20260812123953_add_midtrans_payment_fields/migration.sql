/*
  Warnings:

  - The values [MANUAL_TRANSFER] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - The values [STORE_TRANSFER] on the enum `StockReferenceType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `paymentProofUrl` on the `payments` table. All the data in the column will be lost.
  - Added the required column `city` to the `stores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rajaOngkirCityId` to the `stores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rajaOngkirCityId` to the `user_addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('GATEWAY');
ALTER TABLE "payments" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "StockReferenceType_new" AS ENUM ('ORDER', 'MANUAL_ADJUSTMENT', 'ORDER_CANCEL');
ALTER TABLE "stock_journals" ALTER COLUMN "referenceType" TYPE "StockReferenceType_new" USING ("referenceType"::text::"StockReferenceType_new");
ALTER TYPE "StockReferenceType" RENAME TO "StockReferenceType_old";
ALTER TYPE "StockReferenceType_new" RENAME TO "StockReferenceType";
DROP TYPE "public"."StockReferenceType_old";
COMMIT;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "paymentProofUrl",
ADD COLUMN     "expiredAt" TIMESTAMP(3),
ADD COLUMN     "gatewayOrderId" TEXT,
ADD COLUMN     "gatewayTransactionId" TEXT,
ADD COLUMN     "paymentUrl" TEXT,
ADD COLUMN     "snapToken" TEXT,
ALTER COLUMN "method" SET DEFAULT 'GATEWAY';

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "rajaOngkirCityId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_addresses" ADD COLUMN     "rajaOngkirCityId" TEXT NOT NULL;
