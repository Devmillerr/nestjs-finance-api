-- DropForeignKey
ALTER TABLE "budget_products" DROP CONSTRAINT "budget_products_productId_fkey";

-- AlterTable
ALTER TABLE "budget_products" ALTER COLUMN "productId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "budget_products" ADD CONSTRAINT "budget_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
