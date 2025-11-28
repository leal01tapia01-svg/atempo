-- AlterTable
ALTER TABLE "Cita" ADD COLUMN     "recAnticipacionHoras" INTEGER,
ADD COLUMN     "recCantidad" INTEGER,
ADD COLUMN     "recIntervaloMinutos" INTEGER,
ADD COLUMN     "tieneRecordatorio" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "empleadoId" DROP NOT NULL;
