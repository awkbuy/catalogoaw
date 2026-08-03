"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Copy,
  Trash2,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { sileo } from "sileo";

interface Juego {
  id: string;
  nombre: string;
  slug: string;
  imagen: string | null;
  estado: string;
  destacado: boolean;
  jugadoresMin: number;
  jugadoresMax: number;
  categoria: { nombre: string; color: string };
}

interface Categoria {
  id: string;
  nombre: string;
}

export default function GamesPage() {
  const router = useRouter();
  const [juegos, setJuegos] = useState<Juego[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [sortBy, setSortBy] = useState("nombre");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/juegos").then((r) => r.json()),
      fetch("/api/admin/categorias").then((r) => r.json()),
    ]).then(([j, c]) => {
      setJuegos(j);
      setCategorias(c);
      setLoading(false);
    });
  }, []);

  const filtered = juegos
    .filter((j) => {
      const matchSearch =
        j.nombre.toLowerCase().includes(search.toLowerCase()) ||
        j.categoria.nombre.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategoria
        ? j.categoria.nombre === filterCategoria
        : true;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === "nombre") return a.nombre.localeCompare(b.nombre);
      if (sortBy === "categoria")
        return a.categoria.nombre.localeCompare(b.categoria.nombre);
      return 0;
    });

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/juegos/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }
      setJuegos((prev) => prev.filter((j) => j.id !== deleteId));
      setDeleteId(null);
    } catch {
      sileo.error({ title: "Error al eliminar" });
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/juegos/${id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        const newJuego = await res.json();
        setJuegos((prev) => [...prev, newJuego]);
        sileo.success({ title: "Juego duplicado correctamente" });
      }
    } catch {
      sileo.error({ title: "Error al duplicar" });
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
          <h1 className="text-2xl font-bold text-[#1F2937]">Juegos</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {filtered.length} juego{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/games/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#31D3A9] text-white text-sm font-medium hover:bg-[#2bc49b] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo juego
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar juegos..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-sm text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="appearance-none px-4 py-2 pr-9 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none px-4 py-2 pr-9 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
            >
              <option value="nombre">Nombre</option>
              <option value="categoria">Categoría</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Imagen
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Nombre
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Categoría
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Jugadores
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
              {filtered.map((juego) => (
                <tr
                  key={juego.id}
                  className="border-b border-[#E5E7EB]/50 hover:bg-[#FAFAFA] transition-colors"
                >
                  <td className="px-4 py-3">
                    {juego.imagen ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#E5E7EB]">
                        <Image
                          src={juego.imagen}
                          alt={juego.nombre}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280] text-xs">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[#1F2937]">
                      {juego.nombre}
                    </p>
                    {juego.destacado && (
                      <span className="text-[10px] font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-md">
                        Destacado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 text-sm text-[#1F2937]"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: juego.categoria.color }}
                      />
                      {juego.categoria.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280]">
                    {juego.jugadoresMin}-{juego.jugadoresMax}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                        juego.estado === "Disponible"
                          ? "bg-[#31D3A9]/10 text-[#31D3A9]"
                          : "bg-[#FF7BAC]/10 text-[#FF7BAC]"
                      }`}
                    >
                      {juego.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() =>
                          router.push(`/games/${juego.id}/edit`)
                        }
                        className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280] hover:text-[#31D3A9] transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(juego.id)}
                        className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280] hover:text-[#FF7BAC] transition-colors"
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(juego.id)}
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
          {filtered.map((juego) => (
            <div key={juego.id} className="p-4">
              <div className="flex items-start gap-3">
                {juego.imagen && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#E5E7EB] flex-shrink-0">
                    <Image
                      src={juego.imagen}
                      alt={juego.nombre}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1F2937] truncate">
                    {juego.nombre}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {juego.categoria.nombre} · {juego.jugadoresMin}-{juego.jugadoresMax} jugadores
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium ${
                        juego.estado === "Disponible"
                          ? "bg-[#31D3A9]/10 text-[#31D3A9]"
                          : "bg-[#FF7BAC]/10 text-[#FF7BAC]"
                      }`}
                    >
                      {juego.estado}
                    </span>
                    {juego.destacado && (
                      <span className="text-[10px] font-medium text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-md">
                        Destacado
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                            onClick={() => router.push(`/games/${juego.id}/edit`)}
                    className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(juego.id)}
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
              No se encontraron juegos
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
                  Eliminar juego
                </h3>
                <button
                  onClick={() => setDeleteId(null)}
                  className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB] flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-[#6B7280]" />
                </button>
              </div>
              <p className="text-sm text-[#6B7280] mb-6">
                ¿Estás seguro de que deseas eliminar este juego? Esta acción no
                se puede deshacer.
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
