-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'READY');

-- AlterTable
ALTER TABLE "chat_rooms" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'PENDING';
