/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[whatsapp,productId]` on the table `StockNotification` will be added. If there are existing duplicate values, this will fail.
  - Made the column `productId` on table `Review` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "recoverySentAt" TIMESTAMP(3),
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "riskFactors" TEXT[];

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaDescriptionAr" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "metaTitleAr" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "productId" SET NOT NULL;

-- AlterTable
ALTER TABLE "StockNotification" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'email',
ADD COLUMN     "whatsapp" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "StockNotification_whatsapp_idx" ON "StockNotification"("whatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "StockNotification_whatsapp_productId_key" ON "StockNotification"("whatsapp", "productId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
