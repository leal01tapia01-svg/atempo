-- AlterTable
ALTER TABLE "Cita" ADD COLUMN     "recEnviados" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recUltimoEnvio" TIMESTAMP(3);
