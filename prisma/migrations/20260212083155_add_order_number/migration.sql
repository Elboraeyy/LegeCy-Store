/*
  Warnings:

  - A unique constraint covering the columns `[orderNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderNumber" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "specs" JSONB;

-- CreateTable
CREATE TABLE "SharedWishlist" (
    "id" TEXT NOT NULL,
    "products" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedWishlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
