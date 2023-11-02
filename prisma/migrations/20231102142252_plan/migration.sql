/*
  Warnings:

  - You are about to drop the column `planExpirationDate` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "subscriptionExpirationDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "planExpirationDate";
