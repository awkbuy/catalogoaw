"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { sileo } from "sileo";
import { useProgress } from "@/lib/progress-context";

interface Landing {
  id: string;
  slug: string;
  title: string;
  description: string;
  heroTitle: string;
  bannerColor: string;
  gameIds: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function LandingsPage() {
  const router = useRouter();
  const { start, done } = useProgress();
  const [landings, setLandings] = useState<Landing[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/landings")
      .then((r) => r.json())
      .then((data) => {
        setLandings(data);
        setLoading(false);
      });
  }, []);

  const filtered = landings.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.slug.toLowerCase().includes(search.toLowerCase())
  );

  const gameCount = (l: Landing) => {
    try {
      const ids = JSON.parse(l.gameIds);
      return Array.isArray(ids) ? ids.length : 0;
    } catch {
      return 0;
    }
  };

  const handleToggle = async (landing: Landing) => {
    setTogglingId(landing.id);
    start();
    try {
      const res = await fetch(`/api/admin/landings/${landing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...landing, isActive: !landing.isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar");
      }
      const updated = await res.json();
      setLandings((prev) =>
        prev.map((l) => (l.id === updated.id ? updated : l))
      );
      sileo.success({
        title: updated.isActive ? "Landing activada" : "Landing desactivada",
      });
    } catch (err: unknown) {
      sileo.error({
        title: err instanceof Error ? err.message : "Error al actualizar",
      });
    } finally {
      done();
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    start();
    try {
      const res = await fetch(`/api/admin/landings/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }
      setLandings((prev) => prev.filter((l) => l.id !== deleteId));
      setDeleteId(null);
    } catch {
      sileo.error({ title: "Error al eliminar" });
    } finally {
      done();
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#31D3A9]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Landings</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Páginas de campaña para marketing
          </p>
        </div>
        <Link
          href="/landings/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#31D3A9] text-[#0B3B30] text-sm font-medium hover:bg-[#2bc49b] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva landing
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar landings..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-sm text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
            />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Landing
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Slug
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Juegos
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Estado
                </th>
                <th className="text-right text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((landing) => (
                <tr
                  key={landing.id}
                  className="border-b border-[#E5E7EB]/50 hover:bg-[#FAFAFA] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: landing.bannerColor }}
                      >
                        {(landing.heroTitle || landing.title || "L")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                      <p className="text-sm font-medium text-[#1F2937]">
                        {landing.title}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/${landing.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#31D3A9] hover:underline"
                    >
                      /{landing.slug}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280]">
                    {gameCount(landing)} juego
                    {gameCount(landing) !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(landing)}
                      disabled={togglingId === landing.id}
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                        landing.isActive
                          ? "bg-[#31D3A9]/10 text-[#31D3A9]"
                          : "bg-[#E5E7EB] text-[#6B7280]"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          landing.isActive ? "bg-[#31D3A9]" : "bg-[#9CA3AF]"
                        }`}
                      />
                      {togglingId === landing.id ? "..." : landing.isActive ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() =>
                          router.push(`/landings/${landing.id}/edit`)
                        }
                        className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280] hover:text-[#31D3A9] transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(landing.id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-[#6B7280] hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[#E5E7EB]/50">
          {filtered.map((landing) => (
            <div key={landing.id} className="p-4">
              <div className="flex items-start gap-3">
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: landing.bannerColor }}
                >
                  {(landing.heroTitle || landing.title || "L")
                    .charAt(0)
                    .toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1F2937] truncate">
                    {landing.title}
                  </p>
                  <p className="text-xs text-[#6B7280] truncate">
                    /{landing.slug} · {gameCount(landing)} juego
                    {gameCount(landing) !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => handleToggle(landing)}
                      disabled={togglingId === landing.id}
                      className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium disabled:opacity-50 ${
                        landing.isActive
                          ? "bg-[#31D3A9]/10 text-[#31D3A9]"
                          : "bg-[#E5E7EB] text-[#6B7280]"
                      }`}
                    >
                      {togglingId === landing.id
                        ? "..."
                        : landing.isActive
                        ? "Activa"
                        : "Inactiva"}
                    </button>
                    <a
                      href={`/${landing.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-medium text-[#31D3A9]"
                    >
                      Ver
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => router.push(`/landings/${landing.id}/edit`)}
                    className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(landing.id)}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-[#6B7280] hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[#6B7280] text-sm">
              {search
                ? "No se encontraron landings"
                : "Todavía no hay landings creadas"}
            </p>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1F2937]">
                  Eliminar landing
                </h3>
                <button
                  onClick={() => setDeleteId(null)}
                  className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB] flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-[#6B7280]" />
                </button>
              </div>
              <p className="text-sm text-[#6B7280] mb-6">
                ¿Estás seguro de que deseas eliminar esta landing? Esta acción
                no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#1F2937] hover:bg-[#FAFAFA] disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
