/*
  Warnings:

  - You are about to drop the `bills` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `purchases` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "payment_method" "payment_methodTypes" NOT NULL DEFAULT 'Paypal',
ADD COLUMN     "payment_status" "paymentTypes" NOT NULL DEFAULT 'Not_Completed';

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "payment_method" "payment_methodTypes" NOT NULL DEFAULT 'Paypal',
ADD COLUMN     "payment_status" "paymentTypes" NOT NULL DEFAULT 'Not_Completed',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "bills";
