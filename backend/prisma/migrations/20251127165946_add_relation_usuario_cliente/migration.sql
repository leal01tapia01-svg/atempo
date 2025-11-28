/*
  Warnings:

  - A unique constraint covering the columns `[usuarioId,correo]` on the table `ClienteFrecuente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[usuarioId,celular]` on the table `ClienteFrecuente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[celular]` on the table `Empleado` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Empleado` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usuarioId` to the `ClienteFrecuente` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."ClienteFrecuente_celular_key";

-- DropIndex
DROP INDEX "public"."ClienteFrecuente_correo_key";

-- DropIndex
DROP INDEX "public"."Empleado_usuarioId_celular_key";

-- DropIndex
DROP INDEX "public"."Empleado_usuarioId_email_key";

-- AlterTable
ALTER TABLE "ClienteFrecuente" ADD COLUMN     "usuarioId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ClienteFrecuente_usuarioId_idx" ON "ClienteFrecuente"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteFrecuente_usuarioId_correo_key" ON "ClienteFrecuente"("usuarioId", "correo");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteFrecuente_usuarioId_celular_key" ON "ClienteFrecuente"("usuarioId", "celular");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_celular_key" ON "Empleado"("celular");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_email_key" ON "Empleado"("email");

-- AddForeignKey
ALTER TABLE "ClienteFrecuente" ADD CONSTRAINT "ClienteFrecuente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
