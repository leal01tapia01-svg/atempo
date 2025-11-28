-- AlterTable
ALTER TABLE "Empleado" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "nota" TEXT,
    "color" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cita_usuarioId_startAt_idx" ON "Cita"("usuarioId", "startAt");

-- CreateIndex
CREATE INDEX "Cita_empleadoId_startAt_idx" ON "Cita"("empleadoId", "startAt");

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
