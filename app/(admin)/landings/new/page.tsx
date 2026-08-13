import { prisma } from "@/lib/prisma";
import LandingForm from "@/components/admin/LandingForm";

export const dynamic = "force-dynamic";

interface ProductOption {
  id: string;
  nombre: string;
  imagen: string;
  categoria: { nombre: string };
}

export default async function NewLandingPage() {
  const products = await prisma.product.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      imagen: true,
      categoria: { select: { nombre: true } },
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Nueva landing</h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Creá una página de campaña para marketing
        </p>
      </div>
      <LandingForm products={products as ProductOption[]} mode="create" />
    </div>
  );
}
