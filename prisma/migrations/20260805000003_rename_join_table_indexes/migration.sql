-- Al renombrar la tabla, SQLite conserva los nombres de los índices
-- heredados de "_CategoryToGame". Se renombran para coincidir con el
-- esquema esperado por Prisma.
DROP INDEX "_CategoryToGame_B_index";
CREATE INDEX "_GameCategories_B_index" ON "_GameCategories"("B");

DROP INDEX "_CategoryToGame_AB_unique";
CREATE UNIQUE INDEX "_GameCategories_AB_unique" ON "_GameCategories"("A", "B");
