import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categorias = await prisma.category.findMany({
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Nuevo producto</h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Agrega un nuevo producto al catálogo
        </p>
      </div>
      <ProductForm categorias={categorias} mode="create" />
    </div>
  );
}
