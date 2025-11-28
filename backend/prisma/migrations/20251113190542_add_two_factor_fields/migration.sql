-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "twoFactorCode" TEXT,
ADD COLUMN     "twoFactorExpires" TIMESTAMP(3);
