/*
  Warnings:

  - The values [Completed,Pending,Not_Completed] on the enum `paymentTypes` will be removed. If these variants are still used in the database, this will fail.
  - The values [Paypal,Stripe,Crypto] on the enum `payment_method_Types` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "paymentTypes_new" AS ENUM ('COMPLETED', 'PENDING', 'NOT_COMPLETED', 'CANCELED');
ALTER TABLE "budgets" ALTER COLUMN "payment_status" DROP DEFAULT;
ALTER TABLE "purchases" ALTER COLUMN "payment_status" DROP DEFAULT;
ALTER TABLE "purchases" ALTER COLUMN "payment_status" TYPE "paymentTypes_new" USING ("payment_status"::text::"paymentTypes_new");
ALTER TABLE "budgets" ALTER COLUMN "payment_status" TYPE "paymentTypes_new" USING ("payment_status"::text::"paymentTypes_new");
ALTER TYPE "paymentTypes" RENAME TO "paymentTypes_old";
ALTER TYPE "paymentTypes_new" RENAME TO "paymentTypes";
DROP TYPE "paymentTypes_old";
ALTER TABLE "budgets" ALTER COLUMN "payment_status" SET DEFAULT 'NOT_COMPLETED';
ALTER TABLE "purchases" ALTER COLUMN "payment_status" SET DEFAULT 'NOT_COMPLETED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "payment_method_Types_new" AS ENUM ('PAYPAL', 'STRIPE', 'CRYPTO');
ALTER TABLE "budgets" ALTER COLUMN "payment_method" DROP DEFAULT;
ALTER TABLE "purchases" ALTER COLUMN "payment_method" DROP DEFAULT;
ALTER TABLE "purchases" ALTER COLUMN "payment_method" TYPE "payment_method_Types_new" USING ("payment_method"::text::"payment_method_Types_new");
ALTER TABLE "budgets" ALTER COLUMN "payment_method" TYPE "payment_method_Types_new" USING ("payment_method"::text::"payment_method_Types_new");
ALTER TYPE "payment_method_Types" RENAME TO "payment_method_Types_old";
ALTER TYPE "payment_method_Types_new" RENAME TO "payment_method_Types";
DROP TYPE "payment_method_Types_old";
ALTER TABLE "budgets" ALTER COLUMN "payment_method" SET DEFAULT 'PAYPAL';
ALTER TABLE "purchases" ALTER COLUMN "payment_method" SET DEFAULT 'PAYPAL';
COMMIT;

-- AlterTable
ALTER TABLE "budgets" ALTER COLUMN "total" DROP NOT NULL,
ALTER COLUMN "payment_status" SET DEFAULT 'NOT_COMPLETED',
ALTER COLUMN "payment_method" SET DEFAULT 'PAYPAL';

-- AlterTable
ALTER TABLE "purchases" ALTER COLUMN "payment_status" SET DEFAULT 'NOT_COMPLETED',
ALTER COLUMN "payment_method" SET DEFAULT 'PAYPAL';
