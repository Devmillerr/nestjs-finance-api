-- CreateEnum
CREATE TYPE "paymentTypes" AS ENUM ('Completed', 'Pending', 'Not_Completed');

-- CreateEnum
CREATE TYPE "payment_methodTypes" AS ENUM ('Paypal', 'Stripe', 'Crypto');

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" "payment_methodTypes" NOT NULL DEFAULT 'Paypal',
    "payment_status" "paymentTypes" NOT NULL DEFAULT 'Not_Completed',

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAT" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_products" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "budget_products_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_products" ADD CONSTRAINT "budget_products_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_products" ADD CONSTRAINT "budget_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
