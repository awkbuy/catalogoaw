-- AlterTable
ALTER TABLE "AnalyticsEvent" ADD COLUMN "utmCampaign" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN "utmContent" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN "utmTerm" TEXT;

-- CreateIndex
CREATE INDEX "AnalyticsEvent_utmSource_idx" ON "AnalyticsEvent"("utmSource");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_utmCampaign_idx" ON "AnalyticsEvent"("utmCampaign");
