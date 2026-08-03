-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "icono" TEXT NOT NULL DEFAULT '🎲',
    "color" TEXT NOT NULL DEFAULT '#31D3A9',
    "tags" TEXT NOT NULL DEFAULT '',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "categoriaId" TEXT NOT NULL,
    "jugadoresMin" INTEGER NOT NULL DEFAULT 2,
    "jugadoresMax" INTEGER NOT NULL DEFAULT 6,
    "duracion" TEXT NOT NULL DEFAULT '60 min',
    "edad" TEXT NOT NULL DEFAULT '8+',
    "dificultad" TEXT NOT NULL DEFAULT 'Normal',
    "precioFinalVenta" TEXT NOT NULL DEFAULT '',
    "descuento" INTEGER NOT NULL DEFAULT 0,
    "precioReservaMesa" TEXT NOT NULL DEFAULT '',
    "imagen" TEXT NOT NULL DEFAULT '',
    "integrarVideo" BOOLEAN NOT NULL DEFAULT false,
    "videoUrl" TEXT NOT NULL DEFAULT '',
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "seoKeywords" TEXT NOT NULL DEFAULT '',
    "canonical" TEXT NOT NULL DEFAULT '',
    "imagenAlt" TEXT NOT NULL DEFAULT '',
    "descripcionAccesible" TEXT NOT NULL DEFAULT '',
    "resumenIA" TEXT NOT NULL DEFAULT '',
    "estado" TEXT NOT NULL DEFAULT 'Disponible',
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "nuevo" BOOLEAN NOT NULL DEFAULT false,
    "disponibleVenta" BOOLEAN NOT NULL DEFAULT false,
    "disponibleMesa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Game_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'porcentaje',
    "valor" INTEGER NOT NULL DEFAULT 0,
    "minimo" INTEGER NOT NULL DEFAULT 0,
    "maximo" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "vencimiento" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL DEFAULT '',
    "descripcion" TEXT NOT NULL DEFAULT '',
    "icono" TEXT NOT NULL DEFAULT 'credit_card',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "promocional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_nombre_key" ON "Category"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "Game_slug_idx" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "Game_categoriaId_idx" ON "Game"("categoriaId");

-- CreateIndex
CREATE INDEX "Game_orden_idx" ON "Game"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_codigo_key" ON "Coupon"("codigo");

-- CreateIndex
CREATE INDEX "Coupon_codigo_idx" ON "Coupon"("codigo");

-- CreateIndex
CREATE INDEX "PaymentMethod_orden_idx" ON "PaymentMethod"("orden");
