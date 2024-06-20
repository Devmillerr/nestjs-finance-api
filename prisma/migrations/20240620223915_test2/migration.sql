-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_userdetailsId_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "userdetailsId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_userdetailsId_fkey" FOREIGN KEY ("userdetailsId") REFERENCES "userDetails"("id") ON DELETE SET NULL ON UPDATE CASCADE;
