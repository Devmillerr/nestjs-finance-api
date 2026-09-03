-- FinanceApi V3 — migración inicial (fiel a prisma/schema.prisma)

CREATE TYPE "Role" AS ENUM ('USER', 'TEAM', 'ADMIN', 'OWNER');
CREATE TYPE "ProductType" AS ENUM ('WEB', 'FIVEM', 'DISCORD_BOT');
CREATE TYPE "PaymentStatus" AS ENUM ('COMPLETED', 'PENDING', 'NOT_COMPLETED', 'CANCELED');
CREATE TYPE "PaymentMethod" AS ENUM ('PAYPAL', 'STRIPE', 'CRYPTO');
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED', 'CANCELED');
CREATE TYPE "ChargeType" AS ENUM ('DISCOUNT', 'OTHER', 'TAX');
CREATE TYPE "PermissionName" AS ENUM (
  'CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER',
  'READ_USER_DETAILS', 'UPDATE_USER_DETAILS',
  'CREATE_PRODUCT', 'READ_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT',
  'CREATE_PURCHASE', 'READ_PURCHASE', 'UPDATE_PURCHASE', 'DELETE_PURCHASE',
  'CREATE_INVOICE', 'READ_INVOICE', 'UPDATE_INVOICE', 'DELETE_INVOICE',
  'CREATE_BUDGET', 'READ_BUDGET', 'UPDATE_BUDGET', 'DELETE_BUDGET',
  'READ_ADMIN_PANEL', 'UPDATE_SETTINGS', 'MANAGE_ROLES', 'VIEW_REPORTS',
  'EXPORT_DATA', 'ASSIGN_ROLE', 'VIEW_ACTIVITY_LOG', 'ALL_PERMISSION'
);

CREATE TABLE "user_details" (
  "id" TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "nickname" TEXT,
  "zipCode" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "detailsId" TEXT UNIQUE REFERENCES "user_details"("id")
);
CREATE INDEX "users_email_idx" ON "users"("email");

CREATE TABLE "refresh_tokens" (
  "id" TEXT PRIMARY KEY,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "replacedByTokenHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdByIp" TEXT
);
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

CREATE TABLE "permissions" (
  "id" TEXT PRIMARY KEY,
  "name" "PermissionName" NOT NULL UNIQUE,
  "description" TEXT
);

CREATE TABLE "user_permissions" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "permissionId" TEXT NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "permissionId")
);
CREATE INDEX "user_permissions_userId_idx" ON "user_permissions"("userId");
CREATE INDEX "user_permissions_permissionId_idx" ON "user_permissions"("permissionId");

CREATE TABLE "products" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "photoUrl" TEXT NOT NULL,
  "type" "ProductType" NOT NULL DEFAULT 'WEB',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "purchases" (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "users"("id"),
  "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PAYPAL',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_COMPLETED',
  "totalCents" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX "purchases_clientId_idx" ON "purchases"("clientId");

CREATE TABLE "purchase_products" (
  "id" TEXT PRIMARY KEY,
  "purchaseId" TEXT NOT NULL REFERENCES "purchases"("id") ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPriceCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "purchase_products_purchaseId_idx" ON "purchase_products"("purchaseId");
CREATE INDEX "purchase_products_productId_idx" ON "purchase_products"("productId");

CREATE TABLE "services" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "photoUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "service_contracts" (
  "id" TEXT PRIMARY KEY,
  "serviceId" TEXT REFERENCES "services"("id"),
  "clientId" TEXT NOT NULL REFERENCES "users"("id"),
  "name" TEXT,
  "description" TEXT,
  "priceCents" INTEGER,
  "notes" TEXT,
  "status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX "service_contracts_serviceId_idx" ON "service_contracts"("serviceId");
CREATE INDEX "service_contracts_clientId_idx" ON "service_contracts"("clientId");

CREATE TABLE "service_assignments" (
  "id" TEXT PRIMARY KEY,
  "serviceContractId" TEXT NOT NULL REFERENCES "service_contracts"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "service_assignments_serviceContractId_idx" ON "service_assignments"("serviceContractId");
CREATE INDEX "service_assignments_userId_idx" ON "service_assignments"("userId");

CREATE TABLE "budgets" (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "users"("id"),
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX "budgets_clientId_idx" ON "budgets"("clientId");

CREATE TABLE "budget_products" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT,
  "description" TEXT,
  "priceCents" INTEGER DEFAULT 0,
  "budgetId" TEXT NOT NULL REFERENCES "budgets"("id") ON DELETE CASCADE,
  "productId" TEXT REFERENCES "products"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "budget_products_budgetId_idx" ON "budget_products"("budgetId");
CREATE INDEX "budget_products_productId_idx" ON "budget_products"("productId");

CREATE TABLE "invoices" (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "users"("id"),
  "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PAYPAL',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_COMPLETED',
  "paymentTransaction" TEXT,
  "expiration" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3)
);
CREATE INDEX "invoices_clientId_idx" ON "invoices"("clientId");

CREATE TABLE "invoice_charges" (
  "id" TEXT PRIMARY KEY,
  "type" "ChargeType" NOT NULL DEFAULT 'OTHER',
  "amountCents" INTEGER NOT NULL,
  "invoiceId" TEXT NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "invoice_charges_invoiceId_idx" ON "invoice_charges"("invoiceId");

CREATE TABLE "invoice_products" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "priceCents" INTEGER NOT NULL,
  "invoiceId" TEXT REFERENCES "invoices"("id") ON DELETE CASCADE,
  "productId" TEXT REFERENCES "products"("id") ON DELETE SET NULL,
  "serviceId" TEXT REFERENCES "services"("id") ON DELETE SET NULL,
  "serviceContractId" TEXT REFERENCES "service_contracts"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "invoice_products_invoiceId_idx" ON "invoice_products"("invoiceId");
CREATE INDEX "invoice_products_productId_idx" ON "invoice_products"("productId");
CREATE INDEX "invoice_products_serviceId_idx" ON "invoice_products"("serviceId");
CREATE INDEX "invoice_products_serviceContractId_idx" ON "invoice_products"("serviceContractId");

-- Todas las tablas conectan solo a través de nuestra API NestJS (Prisma con
-- la connection string del owner), nunca vía la API REST autogenerada de
-- Supabase (PostgREST) con las keys anon/service_role. Por eso se habilita
-- RLS sin policies: deniega por defecto cualquier acceso vía esa API pública,
-- sin afectar la conexión directa de Prisma (que no pasa por PostgREST).
ALTER TABLE "user_details" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "purchase_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "service_contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "service_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "budgets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "budget_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_charges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_products" ENABLE ROW LEVEL SECURITY;
