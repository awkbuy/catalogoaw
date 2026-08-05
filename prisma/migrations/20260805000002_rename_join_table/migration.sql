-- Prisma espera la tabla implícita "_GameCategories" para la relación
-- many-to-many "GameCategories". Se renombra la tabla creada en
-- 20260805000001_multi_categoria para que coincida con el naming de Prisma.
ALTER TABLE "_CategoryToGame" RENAME TO "_GameCategories";
