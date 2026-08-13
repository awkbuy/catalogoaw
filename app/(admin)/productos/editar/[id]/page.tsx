import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [producto, categorias] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { categorias: { select: { id: true } } },
    }),
    prisma.category.findMany({
      orderBy: { orden: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);

  if (!producto) notFound();

  const productData = {
    id: producto.id,
    nombre: producto.nombre,
    slug: producto.slug,
    descripcion: producto.descripcion || "",
    categoriaId: producto.categoriaId,
    categoriaIds: producto.categorias.map((c) => c.id),
    precioFinalVenta: producto.precioFinalVenta || "",
    descuento: String(producto.descuento),
    envioGratis: producto.envioGratis,
    imagen: producto.imagen || "",
    integrarVideo: producto.integrarVideo,
    videoUrl: producto.videoUrl || "",
    estado: producto.estado,
    destacado: producto.destacado,
    nuevo: producto.nuevo,
    disponibleVenta: producto.disponibleVenta,
    orden: String(producto.orden),
    seoTitle: producto.seoTitle || "",
    seoDescription: producto.seoDescription || "",
    seoKeywords: producto.seoKeywords || "",
    canonical: producto.canonical || "",
    imagenAlt: producto.imagenAlt || "",
    descripcionAccesible: producto.descripcionAccesible || "",
    resumenIA: producto.resumenIA || "",
    showInMerchant: producto.showInMerchant,
    showInMetaCommerce: producto.showInMetaCommerce,
    allowDynamicAds: producto.allowDynamicAds,
    marketingFeatured: producto.marketingFeatured,
    remarketingEligible: producto.remarketingEligible,
    googleProductCategory: producto.googleProductCategory || "",
    metaProductCategory: producto.metaProductCategory || "",
    gtin: producto.gtin || "",
    mpn: producto.mpn || "",
    brand: producto.brand || "Catalogo App",
    condition: producto.condition || "new",
    marketingPriority: String(producto.marketingPriority),
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Editar producto</h1>
        <p className="text-[#6B7280] text-sm mt-1">{producto.nombre}</p>
      </div>
      <ProductForm
        initialData={productData}
        categorias={categorias}
        mode="edit"
      />
    </div>
  );
}
