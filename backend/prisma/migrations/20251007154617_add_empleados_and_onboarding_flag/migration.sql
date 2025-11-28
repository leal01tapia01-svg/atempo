-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Empleado" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fotoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Empleado_usuarioId_idx" ON "Empleado"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_usuarioId_email_key" ON "Empleado"("usuarioId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_usuarioId_celular_key" ON "Empleado"("usuarioId", "celular");

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
