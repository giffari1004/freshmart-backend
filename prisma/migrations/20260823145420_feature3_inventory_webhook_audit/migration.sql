/*
  Warnings:

  - A unique constraint covering the columns `[orderId,transactionId,transactionStatus]` on the table `payment_webhook_events` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StockJournalType" ADD VALUE 'RESERVE';
ALTER TYPE "StockJournalType" ADD VALUE 'RELEASE';

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_orderId_transactionId_transactionSta_key" ON "payment_webhook_events"("orderId", "transactionId", "transactionStatus");
