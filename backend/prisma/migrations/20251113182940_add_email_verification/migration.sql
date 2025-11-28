-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationCode" TEXT,
ADD COLUMN     "verificationExpires" TIMESTAMP(3);
