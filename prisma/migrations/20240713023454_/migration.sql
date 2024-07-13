-- CreateEnum
CREATE TYPE "role" AS ENUM ('USER', 'TEAM', 'ADMIN', 'OWN');

-- CreateEnum
CREATE TYPE "permissionTypes" AS ENUM ('CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'READ_USER_DETAILS', 'UPDATE_USER_DETAILS', 'CREATE_PRODUCT', 'READ_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT', 'CREATE_PURCHASE', 'READ_PURCHASE', 'UPDATE_PURCHASE', 'DELETE_PURCHASE', 'CREATE_INVOICE', 'READ_INVOICE', 'UPDATE_INVOICE', 'DELETE_INVOICE', 'CREATE_BUDGET', 'READ_BUDGET', 'UPDATE_BUDGET', 'DELETE_BUDGET', 'READ_ADMIN_PANEL', 'UPDATE_SETTINGS', 'VIEW_REPORTS', 'EXPORT_DATA', 'ASSIGN_ROLE', 'VIEW_ACTIVITY_LOG', 'ALL_PERMISSION');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "role" NOT NULL DEFAULT 'USER';

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

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
