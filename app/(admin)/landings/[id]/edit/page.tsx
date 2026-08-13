import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LandingForm from "@/components/admin/LandingForm";

export const dynamic = "force-dynamic";

interface ProductOption {
  id: string;
  nombre: string;
  imagen: string;
  categoria: { nombre: string };
}

export default async function EditLandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [landing, products] = await Promise.all([
    prisma.landingPage.findUnique({ where: { id } }),
    prisma.product.findMany({
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        imagen: true,
        categoria: { select: { nombre: true } },
      },
    }),
  ]);

  if (!landing) notFound();

  const landingData = {
    id: landing.id,
    slug: landing.slug,
    title: landing.title,
    description: landing.description,
    heroTitle: landing.heroTitle,
    heroDescription: landing.heroDescription,
    heroImage: landing.heroImage,
    bannerColor: landing.bannerColor,
    seoTitle: landing.seoTitle,
    seoDescription: landing.seoDescription,
    seoKeywords: landing.seoKeywords,
    canonical: landing.canonical,
    productIds: landing.productIds,
    isActive: landing.isActive,
    sortOrder: String(landing.sortOrder),
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Editar landing</h1>
        <p className="text-[#6B7280] text-sm mt-1">{landing.title}</p>
      </div>
      <LandingForm
        initialData={landingData}
        products={products as ProductOption[]}
        mode="edit"
      />
    </div>
  );
}
