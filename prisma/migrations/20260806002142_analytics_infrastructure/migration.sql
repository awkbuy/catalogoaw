-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "gameId" TEXT,
    "gameName" TEXT,
    "categoryId" TEXT,
    "categoryName" TEXT,
    "searchTerm" TEXT,
    "source" TEXT,
    "price" REAL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DailyMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "productViews" INTEGER NOT NULL DEFAULT 0,
    "cartAdditions" INTEGER NOT NULL DEFAULT 0,
    "whatsappClicks" INTEGER NOT NULL DEFAULT 0,
    "searches" INTEGER NOT NULL DEFAULT 0,
    "checkouts" INTEGER NOT NULL DEFAULT 0,
    "topDevice" TEXT,
    "topBrowser" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "categoryName" TEXT,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalCartAdds" INTEGER NOT NULL DEFAULT 0,
    "totalWhatsapp" INTEGER NOT NULL DEFAULT 0,
    "totalCheckouts" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CategoryMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalCartAdds" INTEGER NOT NULL DEFAULT 0,
    "totalWhatsapp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GA4DailyMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_gameId_idx" ON "AnalyticsEvent"("gameId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetrics_date_key" ON "DailyMetrics"("date");

-- CreateIndex
CREATE INDEX "DailyMetrics_date_idx" ON "DailyMetrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMetrics_gameId_key" ON "ProductMetrics"("gameId");

-- CreateIndex
CREATE INDEX "ProductMetrics_totalViews_idx" ON "ProductMetrics"("totalViews" DESC);

-- CreateIndex
CREATE INDEX "ProductMetrics_totalCartAdds_idx" ON "ProductMetrics"("totalCartAdds" DESC);

-- CreateIndex
CREATE INDEX "ProductMetrics_totalWhatsapp_idx" ON "ProductMetrics"("totalWhatsapp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryMetrics_categoryId_key" ON "CategoryMetrics"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryMetrics_totalViews_idx" ON "CategoryMetrics"("totalViews" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "GA4DailyMetrics_date_key" ON "GA4DailyMetrics"("date");

-- CreateIndex
CREATE INDEX "GA4DailyMetrics_date_idx" ON "GA4DailyMetrics"("date");
