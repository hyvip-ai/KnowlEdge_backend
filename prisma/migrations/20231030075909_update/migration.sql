/*
  Warnings:

  - The values [STARTUP,ENTERPRISE,CUSTOM] on the enum `SUBSCRIPTION` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SUBSCRIPTION_new" AS ENUM ('SOLO', 'TEAM');
ALTER TABLE "organizations" ALTER COLUMN "subscription" DROP DEFAULT;
ALTER TABLE "organizations" ALTER COLUMN "subscription" TYPE "SUBSCRIPTION_new" USING ("subscription"::text::"SUBSCRIPTION_new");
ALTER TYPE "SUBSCRIPTION" RENAME TO "SUBSCRIPTION_old";
ALTER TYPE "SUBSCRIPTION_new" RENAME TO "SUBSCRIPTION";
DROP TYPE "SUBSCRIPTION_old";
ALTER TABLE "organizations" ALTER COLUMN "subscription" SET DEFAULT 'SOLO';
COMMIT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "planExpirationDate" TIMESTAMP(3);
