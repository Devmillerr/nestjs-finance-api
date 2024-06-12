/*
  Warnings:

  - The `payment_method` column on the `budgets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `payment_method` column on the `purchases` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "payment_method_Types" AS ENUM ('Paypal', 'Stripe', 'Crypto');

-- AlterTable
ALTER TABLE "budgets" DROP COLUMN "payment_method",
ADD COLUMN     "payment_method" "payment_method_Types" NOT NULL DEFAULT 'Paypal';

-- AlterTable
ALTER TABLE "purchases" DROP COLUMN "payment_method",
ADD COLUMN     "payment_method" "payment_method_Types" NOT NULL DEFAULT 'Paypal';

-- DropEnum
DROP TYPE "payment_methodTypes";

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payment_method" "payment_method_Types" NOT NULL DEFAULT 'Paypal',
    "payment_status" "paymentTypes" NOT NULL DEFAULT 'Not_Completed',
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_details" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "order_details_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_details" ADD CONSTRAINT "order_details_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
