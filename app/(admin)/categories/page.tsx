"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  GripVertical,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { sileo } from "sileo";

interface Categoria {
  id: string;
  nombre: string;
  icono: string | null;
  color: string;
  tags: string;
  orden: number;
  _count: { games: number };
}

export default function CategoriesPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [uploadingIcono, setUploadingIcono] = useState(false);
  const iconoInputRef = useRef<HTMLInputElement>(null);

  const handleIconoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcono(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setForm((prev) => ({ ...prev, icono: data.url }));
    } catch {
      sileo.error({ title: "Error al subir imagen" });
    } finally {
      setUploadingIcono(false);
    }
  };

  const [form, setForm] = useState({
    nombre: "",
    icono: "",
    color: "#31D3A9",
    tags: "",
    orden: "",
  });

  useEffect(() => {
    fetch("/api/admin/categorias")
      .then((r) => r.json())
      .then((data) => {
        setCategorias(data);
        setLoading(false);
      });
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      nombre: "",
      icono: "",
      color: "#31D3A9",
      tags: "",
      orden: String(categorias.length),
    });
    setShowModal(true);
  };

  const openEdit = (cat: Categoria) => {
    setEditingId(cat.id);
    setForm({
      nombre: cat.nombre,
      icono: cat.icono || "",
      color: cat.color,
      tags: cat.tags || "",
      orden: String(cat.orden),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/categorias/${editingId}`
        : "/api/admin/categorias";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          orden: Number(form.orden) || 0,
        }),
      });

      if (res.ok) {
        const cat = await res.json();
        if (editingId) {
          setCategorias((prev) =>
            prev.map((c) =>
              c.id === editingId
                ? { ...c, ...form, orden: Number(form.orden) || 0, _count: c._count }
                : c
            )
          );
          sileo.success({ title: "Categoría actualizada" });
        } else {
          setCategorias((prev) => [
            ...prev,
            { ...cat, _count: { games: 0 } },
          ]);
          sileo.success({ title: "Categoría creada" });
        }
        setShowModal(false);
      }
    } catch {
      sileo.error({ title: "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categorias/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCategorias((prev) => prev.filter((c) => c.id !== deleteId));
        setDeleteId(null);
        sileo.success({ title: "Categoría eliminada" });
      } else {
        const data = await res.json();
        sileo.error({ title: data.error || "Error al eliminar" });
      }
    } catch {
      sileo.error({ title: "Error al eliminar" });
    } finally {
      setDeleting(false);
    }
  };

  const handleOrderChange = async (id: string, newOrder: number) => {
    setCategorias((prev) =>
      prev.map((c) => (c.id === id ? { ...c, orden: newOrder } : c))
    );
    await fetch(`/api/admin/categorias/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orden: newOrder }),
    });
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
          <h1 className="text-2xl font-bold text-[#1F2937]">Categorías</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {categorias.length} categorías
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#31D3A9] text-white text-sm font-medium hover:bg-[#2bc49b] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva categoría
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Icono
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Nombre
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Color
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Orden
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Juegos
                </th>
                <th className="text-right text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-[#E5E7EB]/50 hover:bg-[#FAFAFA] transition-colors"
                >
                  <td className="px-4 py-3">
                    {cat.icono && (cat.icono.startsWith("/") || cat.icono.startsWith("http")) ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#E5E7EB]">
                        <Image src={cat.icono} alt="" width={40} height={40} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: cat.color + "20" }}>
                        {cat.icono || "📁"}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[#1F2937]">
                    {cat.nombre}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-md border border-[#E5E7EB]"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs text-[#6B7280] font-mono">
                        {cat.color}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-[#6B7280]/50" />
                      <input
                        type="number"
                        value={cat.orden}
                        onChange={(e) =>
                          handleOrderChange(cat.id, Number(e.target.value))
                        }
                        className="w-16 px-2 py-1 rounded-lg border border-[#E5E7EB] text-sm text-[#1F2937] bg-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#31D3A9]/30 text-center"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280]">
                    {cat._count.games}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280] hover:text-[#31D3A9] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(cat.id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-[#6B7280] hover:text-red-500 transition-colors"
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
          {categorias.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center gap-3">
                {cat.icono && (cat.icono.startsWith("/") || cat.icono.startsWith("http")) ? (
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#E5E7EB] flex-shrink-0">
                    <Image src={cat.icono} alt="" width={40} height={40} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: cat.color + "20" }}
                  >
                    {cat.icono || "📁"}
                  </div>
                )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1F2937]">
                  {cat.nombre}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {cat._count.games} juegos · Orden: {cat.orden}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(cat)}
                  className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280]"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-[#6B7280] hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#1F2937]">
                  {editingId ? "Editar categoría" : "Nueva categoría"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB] flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-[#6B7280]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, nombre: e.target.value }))
                    }
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                    placeholder="Nombre de la categoría"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Icono (imagen)
                  </label>
                  <input
                    ref={iconoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleIconoUpload}
                    className="hidden"
                  />
                  {form.icono ? (
                    <div className="flex items-center gap-3">
                      {form.icono.startsWith("/") || form.icono.startsWith("http") ? (
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#E5E7EB] flex-shrink-0">
                          <Image
                            src={form.icono}
                            alt=""
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-2xl flex-shrink-0">
                          {form.icono}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => iconoInputRef.current?.click()}
                        disabled={uploadingIcono}
                        className="flex-1 py-2 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#1F2937] hover:bg-[#FAFAFA] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        {uploadingIcono ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, icono: "" }))}
                        className="py-2 px-3 rounded-xl border border-[#E5E7EB] text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => iconoInputRef.current?.click()}
                      disabled={uploadingIcono}
                      className="w-full h-20 rounded-xl border-2 border-dashed border-[#E5E7EB] hover:border-[#31D3A9]/50 flex flex-col items-center justify-center gap-1 transition-colors"
                    >
                      {uploadingIcono ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#31D3A9]" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-[#6B7280]" />
                          <span className="text-xs text-[#6B7280]">Subir imagen</span>
                        </>
                      )}
                    </button>
                  )}
                  <p className="mt-1.5 text-[11px] text-[#9CA3AF]">
                    Tamaño recomendado: 200×200px · Se convertirá automáticamente a WebP
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, color: e.target.value }))
                      }
                      className="w-10 h-10 rounded-lg border border-[#E5E7EB] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.color}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, color: e.target.value }))
                      }
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                    placeholder="descuentos, nuevo, envío-gratis"
                  />
                  <p className="mt-1 text-[11px] text-[#9CA3AF]">
                    Separados por coma
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={form.orden}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        orden: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#1F2937] hover:bg-[#FAFAFA] disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.nombre}
                  className="flex-1 py-2.5 rounded-xl bg-[#31D3A9] text-white text-sm font-medium hover:bg-[#2bc49b] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    "Guardar"
                  ) : (
                    "Crear"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <h3 className="text-lg font-bold text-[#1F2937] mb-2">
                Eliminar categoría
              </h3>
              <p className="text-sm text-[#6B7280] mb-6">
                ¿Estás seguro? Los juegos asignados a esta categoría perderán
                su categorización.
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
