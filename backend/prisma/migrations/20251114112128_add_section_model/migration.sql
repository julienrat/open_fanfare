/*
  Warnings:

  - You are about to drop the column `section` on the `Instrument` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Section" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Instrument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "sectionId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Instrument_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Instrument" ("color", "createdAt", "id", "name", "updatedAt") SELECT "color", "createdAt", "id", "name", "updatedAt" FROM "Instrument";
DROP TABLE "Instrument";
ALTER TABLE "new_Instrument" RENAME TO "Instrument";
CREATE UNIQUE INDEX "Instrument_name_key" ON "Instrument"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Section_name_key" ON "Section"("name");
