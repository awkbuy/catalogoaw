-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "freeFrom" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
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
    "envioGratis" BOOLEAN NOT NULL DEFAULT false,
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
    "showInMerchant" BOOLEAN NOT NULL DEFAULT false,
    "showInMetaCommerce" BOOLEAN NOT NULL DEFAULT false,
    "allowDynamicAds" BOOLEAN NOT NULL DEFAULT false,
    "marketingFeatured" BOOLEAN NOT NULL DEFAULT false,
    "remarketingEligible" BOOLEAN NOT NULL DEFAULT false,
    "googleProductCategory" TEXT NOT NULL DEFAULT '',
    "metaProductCategory" TEXT NOT NULL DEFAULT '',
    "gtin" TEXT NOT NULL DEFAULT '',
    "mpn" TEXT NOT NULL DEFAULT '',
    "brand" TEXT NOT NULL DEFAULT 'Wolfie Room',
    "condition" TEXT NOT NULL DEFAULT 'new',
    "marketingPriority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Game_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Game" ("allowDynamicAds", "brand", "canonical", "categoriaId", "condition", "createdAt", "descripcion", "descripcionAccesible", "descuento", "destacado", "dificultad", "disponibleMesa", "disponibleVenta", "duracion", "edad", "estado", "googleProductCategory", "gtin", "id", "imagen", "imagenAlt", "integrarVideo", "jugadoresMax", "jugadoresMin", "marketingFeatured", "marketingPriority", "metaProductCategory", "mpn", "nombre", "nuevo", "orden", "precioFinalVenta", "precioReservaMesa", "remarketingEligible", "resumenIA", "seoDescription", "seoKeywords", "seoTitle", "showInMerchant", "showInMetaCommerce", "slug", "updatedAt", "videoUrl") SELECT "allowDynamicAds", "brand", "canonical", "categoriaId", "condition", "createdAt", "descripcion", "descripcionAccesible", "descuento", "destacado", "dificultad", "disponibleMesa", "disponibleVenta", "duracion", "edad", "estado", "googleProductCategory", "gtin", "id", "imagen", "imagenAlt", "integrarVideo", "jugadoresMax", "jugadoresMin", "marketingFeatured", "marketingPriority", "metaProductCategory", "mpn", "nombre", "nuevo", "orden", "precioFinalVenta", "precioReservaMesa", "remarketingEligible", "resumenIA", "seoDescription", "seoKeywords", "seoTitle", "showInMerchant", "showInMetaCommerce", "slug", "updatedAt", "videoUrl" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");
CREATE INDEX "Game_slug_idx" ON "Game"("slug");
CREATE INDEX "Game_categoriaId_idx" ON "Game"("categoriaId");
CREATE INDEX "Game_orden_idx" ON "Game"("orden");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ShippingZone_name_key" ON "ShippingZone"("name");

-- CreateIndex
CREATE INDEX "ShippingZone_order_idx" ON "ShippingZone"("order");
