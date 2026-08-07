/*
  Warnings:

  - You are about to drop the column `addressId` on the `orders` table. All the data in the column will be lost.
  - Added the required column `city` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullAddress` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientName` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientPhone` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_addressId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "addressId",
ADD COLUMN     "addressNote" TEXT,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "district" TEXT NOT NULL,
ADD COLUMN     "fullAddress" TEXT NOT NULL,
ADD COLUMN     "postalCode" TEXT NOT NULL,
ADD COLUMN     "province" TEXT NOT NULL,
ADD COLUMN     "recipientName" TEXT NOT NULL,
ADD COLUMN     "recipientPhone" TEXT NOT NULL;
