/*
  Warnings:

  - Added the required column `clienteEmail` to the `Cita` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cita" ADD COLUMN     "clienteEmail" TEXT NOT NULL;
