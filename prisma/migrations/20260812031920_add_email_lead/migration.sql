-- CreateTable
CREATE TABLE "EmailLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'popup',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailLead_email_key" ON "EmailLead"("email");

-- CreateIndex
CREATE INDEX "EmailLead_createdAt_idx" ON "EmailLead"("createdAt");
