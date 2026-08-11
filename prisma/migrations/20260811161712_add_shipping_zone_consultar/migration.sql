-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShippingZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "freeFrom" INTEGER NOT NULL DEFAULT 0,
    "consultar" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ShippingZone" ("active", "cost", "createdAt", "freeFrom", "id", "name", "order", "updatedAt") SELECT "active", "cost", "createdAt", "freeFrom", "id", "name", "order", "updatedAt" FROM "ShippingZone";
DROP TABLE "ShippingZone";
ALTER TABLE "new_ShippingZone" RENAME TO "ShippingZone";
CREATE UNIQUE INDEX "ShippingZone_name_key" ON "ShippingZone"("name");
CREATE INDEX "ShippingZone_order_idx" ON "ShippingZone"("order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
