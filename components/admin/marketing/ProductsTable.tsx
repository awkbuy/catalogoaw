"use client";

import type { MarketingProductRow } from "@/lib/marketing/dashboard";

export default function ProductsTable({ products }: { products: MarketingProductRow[] }) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center">
        <p className="text-[#6B7280] text-sm">
          Aún no hay métricas de producto. Navegá el catálogo para comenzar a medir
          vistas, carritos y clics en WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#6B7280] text-xs uppercase tracking-wide border-b border-[#E5E7EB]">
              <th className="px-5 py-3 font-medium">Juego</th>
              <th className="px-5 py-3 font-medium">Categoría</th>
              <th className="px-5 py-3 font-medium text-right">Vistas</th>
              <th className="px-5 py-3 font-medium text-right">+Carrito</th>
              <th className="px-5 py-3 font-medium text-right">WhatsApp</th>
              <th className="px-5 py-3 font-medium text-right">Checkouts</th>
              <th className="px-5 py-3 font-medium text-right">Última vista</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.gameId} className="border-b border-[#E5E7EB]/60 last:border-0 hover:bg-[#FAFAFA]">
                <td className="px-5 py-3 font-medium text-[#1F2937]">{p.gameName}</td>
                <td className="px-5 py-3 text-[#6B7280]">{p.categoryName || "—"}</td>
                <td className="px-5 py-3 text-right text-[#1F2937]">{p.totalViews}</td>
                <td className="px-5 py-3 text-right text-[#1F2937]">{p.totalCartAdds}</td>
                <td className="px-5 py-3 text-right text-[#1F2937]">{p.totalWhatsapp}</td>
                <td className="px-5 py-3 text-right text-[#1F2937]">{p.totalCheckouts}</td>
                <td className="px-5 py-3 text-right text-[#6B7280]">
                  {p.lastViewedAt
                    ? new Intl.DateTimeFormat("es-MX", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(p.lastViewedAt))
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
