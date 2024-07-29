-- CreateEnum
CREATE TYPE "productTypes" AS ENUM ('WEB', 'FIVEM', 'DISCORD_BOT');

-- CreateEnum
CREATE TYPE "paymentTypes" AS ENUM ('COMPLETED', 'PENDING', 'NOT_COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "payment_method_Types" AS ENUM ('PAYPAL', 'STRIPE', 'CRYPTO');

-- CreateEnum
CREATE TYPE "permissionTypes" AS ENUM ('CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'READ_USER_DETAILS', 'UPDATE_USER_DETAILS', 'CREATE_PRODUCT', 'READ_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT', 'CREATE_PURCHASE', 'READ_PURCHASE', 'UPDATE_PURCHASE', 'DELETE_PURCHASE', 'CREATE_INVOICE', 'READ_INVOICE', 'UPDATE_INVOICE', 'DELETE_INVOICE', 'CREATE_BUDGET', 'READ_BUDGET', 'UPDATE_BUDGET', 'DELETE_BUDGET', 'READ_ADMIN_PANEL', 'UPDATE_SETTINGS', 'VIEW_REPORTS', 'EXPORT_DATA', 'ASSIGN_ROLE', 'VIEW_ACTIVITY_LOG', 'ALL_PERMISSION');

-- CreateEnum
CREATE TYPE "statusTypes" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "roleTypes" AS ENUM ('USER', 'TEAM', 'ADMIN', 'OWN');

-- CreateEnum
CREATE TYPE "chargesTypes" AS ENUM ('DISCOUNT', 'OTHER', 'TAX');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "roleTypes" NOT NULL DEFAULT 'USER',
    "userdetailsId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userDetails" (
    "id" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "zipcode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "updatedAT" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "userDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "photo" TEXT NOT NULL,
    "type" "productTypes" NOT NULL DEFAULT 'WEB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAT" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "payment_method" "payment_method_Types" NOT NULL DEFAULT 'PAYPAL',
    "payment_status" "paymentTypes" NOT NULL DEFAULT 'NOT_COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases_products" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT,
    "productId" TEXT,

    CONSTRAINT "purchases_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "payment_method" "payment_method_Types" NOT NULL DEFAULT 'PAYPAL',
    "payment_status" "paymentTypes" NOT NULL DEFAULT 'NOT_COMPLETED',
    "payment_transaccion" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices_charges" (
    "id" TEXT NOT NULL,
    "type" "chargesTypes" NOT NULL DEFAULT 'OTHER',
    "amount" DOUBLE PRECISION NOT NULL,
    "invoicesId" TEXT NOT NULL,

    CONSTRAINT "invoices_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices_products" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "invoicesId" TEXT,
    "productId" TEXT,
    "serviceId" TEXT,
    "servicecontractId" TEXT,

    CONSTRAINT "invoices_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAT" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_products" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION DEFAULT 0,
    "budgetId" TEXT NOT NULL,
    "productId" TEXT,

    CONSTRAINT "budget_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" "permissionTypes" NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "photo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_contracts" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT,
    "clientId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "notes" TEXT,
    "status" "statusTypes" NOT NULL DEFAULT 'PENDING',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services_worke" (
    "id" TEXT NOT NULL,
    "servicecontractId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "services_worke_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_userdetailsId_key" ON "users"("userdetailsId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_userdetailsId_fkey" FOREIGN KEY ("userdetailsId") REFERENCES "userDetails"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases_products" ADD CONSTRAINT "purchases_products_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases_products" ADD CONSTRAINT "purchases_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices_charges" ADD CONSTRAINT "invoices_charges_invoicesId_fkey" FOREIGN KEY ("invoicesId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices_products" ADD CONSTRAINT "invoices_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices_products" ADD CONSTRAINT "invoices_products_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices_products" ADD CONSTRAINT "invoices_products_servicecontractId_fkey" FOREIGN KEY ("servicecontractId") REFERENCES "service_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices_products" ADD CONSTRAINT "invoices_products_invoicesId_fkey" FOREIGN KEY ("invoicesId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_products" ADD CONSTRAINT "budget_products_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_products" ADD CONSTRAINT "budget_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_contracts" ADD CONSTRAINT "service_contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services_worke" ADD CONSTRAINT "services_worke_servicecontractId_fkey" FOREIGN KEY ("servicecontractId") REFERENCES "service_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services_worke" ADD CONSTRAINT "services_worke_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
