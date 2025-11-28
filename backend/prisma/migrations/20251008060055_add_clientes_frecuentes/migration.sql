-- CreateTable
CREATE TABLE "ClienteFrecuente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteFrecuente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClienteFrecuente_correo_key" ON "ClienteFrecuente"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteFrecuente_celular_key" ON "ClienteFrecuente"("celular");
