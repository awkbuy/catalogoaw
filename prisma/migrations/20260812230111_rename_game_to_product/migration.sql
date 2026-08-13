/*
  Warnings:

  - You are about to drop the `Game` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GameCategories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `gameId` on the `AnalyticsEvent` table. All the data in the column will be lost.
  - You are about to drop the column `gameName` on the `AnalyticsEvent` table. All the data in the column will be lost.
  - The primary key for the `GA4DailyMetrics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `GA4DailyMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `gameIds` on the `LandingPage` table. All the data in the column will be lost.
  - You are about to drop the column `gameId` on the `ProductMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `gameName` on the `ProductMetrics` table. All the data in the column will be lost.
  - Added the required column `productId` to the `ProductMetrics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productName` to the `ProductMetrics` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Game_orden_idx";

-- DropIndex
DROP INDEX "Game_categoriaId_idx";

-- DropIndex
DROP INDEX "Game_slug_idx";

-- DropIndex
DROP INDEX "Game_slug_key";

-- DropIndex
DROP INDEX "_GameCategories_AB_unique";

-- DropIndex
DROP INDEX "_GameCategories_B_index";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Game";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_GameCategories";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "categoriaId" TEXT NOT NULL,
    "precioFinalVenta" TEXT NOT NULL DEFAULT '',
    "descuento" INTEGER NOT NULL DEFAULT 0,
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
    "brand" TEXT NOT NULL DEFAULT 'Catalogo App',
    "condition" TEXT NOT NULL DEFAULT 'new',
    "marketingPriority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ProductCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProductCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProductCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT,
    "categoryId" TEXT,
    "categoryName" TEXT,
    "searchTerm" TEXT,
    "source" TEXT,
    "price" REAL,
    "metadata" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AnalyticsEvent" ("categoryId", "categoryName", "createdAt", "eventType", "id", "metadata", "price", "searchTerm", "source", "utmCampaign", "utmContent", "utmMedium", "utmSource", "utmTerm") SELECT "categoryId", "categoryName", "createdAt", "eventType", "id", "metadata", "price", "searchTerm", "source", "utmCampaign", "utmContent", "utmMedium", "utmSource", "utmTerm" FROM "AnalyticsEvent";
DROP TABLE "AnalyticsEvent";
ALTER TABLE "new_AnalyticsEvent" RENAME TO "AnalyticsEvent";
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
CREATE INDEX "AnalyticsEvent_productId_idx" ON "AnalyticsEvent"("productId");
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");
CREATE INDEX "AnalyticsEvent_utmSource_idx" ON "AnalyticsEvent"("utmSource");
CREATE INDEX "AnalyticsEvent_utmCampaign_idx" ON "AnalyticsEvent"("utmCampaign");
CREATE TABLE "new_GA4DailyMetrics" (
    "date" DATETIME NOT NULL,
    "users" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" REAL NOT NULL DEFAULT 0,
    "avgSessionDuration" REAL NOT NULL DEFAULT 0,
    "deviceDesktop" INTEGER NOT NULL DEFAULT 0,
    "deviceMobile" INTEGER NOT NULL DEFAULT 0,
    "deviceTablet" INTEGER NOT NULL DEFAULT 0,
    "topCountries" TEXT,
    "topCities" TEXT,
    "topBrowsers" TEXT,
    "topOS" TEXT,
    "topSources" TEXT,
    "topLandingPages" TEXT,
    "topEvents" TEXT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_GA4DailyMetrics" ("avgSessionDuration", "bounceRate", "createdAt", "date", "deviceDesktop", "deviceMobile", "deviceTablet", "newUsers", "pageViews", "sessions", "syncedAt", "topBrowsers", "topCities", "topCountries", "topEvents", "topLandingPages", "topOS", "topSources", "users") SELECT "avgSessionDuration", "bounceRate", "createdAt", "date", "deviceDesktop", "deviceMobile", "deviceTablet", "newUsers", "pageViews", "sessions", "syncedAt", "topBrowsers", "topCities", "topCountries", "topEvents", "topLandingPages", "topOS", "topSources", "users" FROM "GA4DailyMetrics";
DROP TABLE "GA4DailyMetrics";
ALTER TABLE "new_GA4DailyMetrics" RENAME TO "GA4DailyMetrics";
CREATE UNIQUE INDEX "GA4DailyMetrics_date_key" ON "GA4DailyMetrics"("date");
CREATE INDEX "GA4DailyMetrics_date_idx" ON "GA4DailyMetrics"("date");
CREATE TABLE "new_LandingPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "heroTitle" TEXT NOT NULL DEFAULT '',
    "heroDescription" TEXT NOT NULL DEFAULT '',
    "heroImage" TEXT NOT NULL DEFAULT '',
    "bannerColor" TEXT NOT NULL DEFAULT '#31D3A9',
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "seoKeywords" TEXT NOT NULL DEFAULT '',
    "canonical" TEXT NOT NULL DEFAULT '',
    "productIds" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_LandingPage" ("bannerColor", "canonical", "createdAt", "description", "heroDescription", "heroImage", "heroTitle", "id", "isActive", "seoDescription", "seoKeywords", "seoTitle", "slug", "sortOrder", "title", "updatedAt") SELECT "bannerColor", "canonical", "createdAt", "description", "heroDescription", "heroImage", "heroTitle", "id", "isActive", "seoDescription", "seoKeywords", "seoTitle", "slug", "sortOrder", "title", "updatedAt" FROM "LandingPage";
DROP TABLE "LandingPage";
ALTER TABLE "new_LandingPage" RENAME TO "LandingPage";
CREATE UNIQUE INDEX "LandingPage_slug_key" ON "LandingPage"("slug");
CREATE INDEX "LandingPage_slug_idx" ON "LandingPage"("slug");
CREATE INDEX "LandingPage_isActive_idx" ON "LandingPage"("isActive");
CREATE TABLE "new_ProductMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "categoryName" TEXT,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalCartAdds" INTEGER NOT NULL DEFAULT 0,
    "totalWhatsapp" INTEGER NOT NULL DEFAULT 0,
    "totalCheckouts" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ProductMetrics" ("categoryName", "createdAt", "id", "lastViewedAt", "totalCartAdds", "totalCheckouts", "totalViews", "totalWhatsapp", "updatedAt") SELECT "categoryName", "createdAt", "id", "lastViewedAt", "totalCartAdds", "totalCheckouts", "totalViews", "totalWhatsapp", "updatedAt" FROM "ProductMetrics";
DROP TABLE "ProductMetrics";
ALTER TABLE "new_ProductMetrics" RENAME TO "ProductMetrics";
CREATE UNIQUE INDEX "ProductMetrics_productId_key" ON "ProductMetrics"("productId");
CREATE INDEX "ProductMetrics_totalViews_idx" ON "ProductMetrics"("totalViews" DESC);
CREATE INDEX "ProductMetrics_totalCartAdds_idx" ON "ProductMetrics"("totalCartAdds" DESC);
CREATE INDEX "ProductMetrics_totalWhatsapp_idx" ON "ProductMetrics"("totalWhatsapp" DESC);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoriaId_idx" ON "Product"("categoriaId");

-- CreateIndex
CREATE INDEX "Product_orden_idx" ON "Product"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductCategories_AB_unique" ON "_ProductCategories"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductCategories_B_index" ON "_ProductCategories"("B");
