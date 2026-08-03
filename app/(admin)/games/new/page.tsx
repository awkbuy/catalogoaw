import { prisma } from "@/lib/prisma";
import GameForm from "@/components/admin/GameForm";

export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const categorias = await prisma.category.findMany({
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Nuevo juego</h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Agrega un nuevo juego al catálogo
        </p>
      </div>
      <GameForm categorias={categorias} mode="create" />
    </div>
  );
}
