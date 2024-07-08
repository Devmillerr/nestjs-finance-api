-- AlterTable
ALTER TABLE "budget_products" ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "price" SET DEFAULT 0;
