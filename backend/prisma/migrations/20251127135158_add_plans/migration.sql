-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('GRATIS', 'POPULAR', 'PRO');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'GRATIS';
