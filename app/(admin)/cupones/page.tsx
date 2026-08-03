"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Loader2, Tag } from "lucide-react";
import { sileo } from "sileo";
import { formatPrice } from "@/lib/format";

interface Cupon {
  id: string;
  codigo: string;
  tipo: string;
  valor: number;
  minimo: number;
  maximo: number;
  activo: boolean;
  vencimiento: string | null;
  createdAt: string;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR");
}

function toDateInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CuponesPage() {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    codigo: "",
    tipo: "porcentaje",
    valor: "",
    minimo: "",
    maximo: "",
    vencimiento: "",
    activo: true,
  });

  useEffect(() => {
    fetch("/api/admin/cupones")
      .then((r) => r.json())
      .then((data) => {
        setCupones(data);
        setLoading(false);
      });
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      codigo: "",
      tipo: "porcentaje",
      valor: "",
      minimo: "",
      maximo: "",
      vencimiento: "",
      activo: true,
    });
    setShowModal(true);
  };

  const openEdit = (c: Cupon) => {
    setEditingId(c.id);
    setForm({
      codigo: c.codigo,
      tipo: c.tipo,
      valor: c.valor ? String(c.valor) : "",
      minimo: c.minimo ? String(c.minimo) : "",
      maximo: c.maximo ? String(c.maximo) : "",
      vencimiento: toDateInput(c.vencimiento),
      activo: c.activo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.codigo.trim()) {
      sileo.error({ title: "Ingresá un código de cupón" });
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/cupones/${editingId}` : "/api/admin/cupones";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          valor: Number(form.valor) || 0,
          minimo: Number(form.minimo) || 0,
          maximo: Number(form.maximo) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (editingId) {
          setCupones((prev) =>
            prev.map((c) => (c.id === editingId ? { ...c, ...data } : c))
          );
          sileo.success({ title: "Cupón actualizado" });
        } else {
          setCupones((prev) => [...prev, data]);
          sileo.success({ title: "Cupón creado" });
        }
        setShowModal(false);
      } else {
        sileo.error({ title: data.error || "Error al guardar" });
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
      const res = await fetch(`/api/admin/cupones/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCupones((prev) => prev.filter((c) => c.id !== deleteId));
        setDeleteId(null);
        sileo.success({ title: "Cupón eliminado" });
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

  const renderValor = (c: Cupon) =>
    c.tipo === "porcentaje" ? `${c.valor}%` : formatPrice(c.valor);

  const renderEstado = (c: Cupon) => (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        c.activo ? "bg-[#31D3A9]/10 text-[#31D3A9]" : "bg-[#E5E7EB] text-[#6B7280]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          c.activo ? "bg-[#31D3A9]" : "bg-[#9CA3AF]"
        }`}
      />
      {c.activo ? "Activo" : "Inactivo"}
    </span>
  );

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
          <h1 className="text-2xl font-bold text-[#1F2937]">Cupones</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {cupones.length} cupones
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#31D3A9] text-white text-sm font-medium hover:bg-[#2bc49b] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo cupón
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Código
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Tipo
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Valor
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Mínimo
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Máximo
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Vencimiento
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
              {cupones.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[#E5E7EB]/50 hover:bg-[#FAFAFA] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F2937] uppercase">
                      <Tag className="w-3.5 h-3.5 text-[#31D3A9]" />
                      {c.codigo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280]">
                    {c.tipo === "porcentaje" ? "Porcentaje" : "Monto fijo"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[#1F2937]">
                    {renderValor(c)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280]">
                    {c.minimo ? formatPrice(c.minimo) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280]">
                    {c.maximo ? formatPrice(c.maximo) : "Sin límite"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280]">
                    {formatDate(c.vencimiento)}
                  </td>
                  <td className="px-4 py-3">{renderEstado(c)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280] hover:text-[#31D3A9] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(c.id)}
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
          {cupones.map((c) => (
            <div key={c.id} className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1F2937] uppercase">
                  <Tag className="w-3.5 h-3.5 text-[#31D3A9]" />
                  {c.codigo}
                </span>
                {renderEstado(c)}
              </div>
              <p className="text-xs text-[#6B7280]">
                {c.tipo === "porcentaje" ? "Porcentaje" : "Monto fijo"} · {renderValor(c)}
                {c.minimo ? ` · Mín. ${formatPrice(c.minimo)}` : ""}
                {c.maximo ? ` · Máx. ${formatPrice(c.maximo)}` : ""}
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Vence: {formatDate(c.vencimiento)}
              </p>
              <div className="flex items-center justify-end gap-1 mt-2">
                <button
                  onClick={() => openEdit(c)}
                  className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280]"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(c.id)}
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
                  {editingId ? "Editar cupón" : "Nuevo cupón"}
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
                    Código *
                  </label>
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, codigo: e.target.value.toUpperCase() }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                    placeholder="BIENVENIDO10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Tipo de descuento
                  </label>
                  <div className="flex rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-1 gap-1">
                    {[
                      { value: "porcentaje", label: "Porcentaje" },
                      { value: "monto", label: "Monto fijo" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, tipo: opt.value }))
                        }
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          form.tipo === opt.value
                            ? "bg-[#31D3A9] text-white"
                            : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                      {form.tipo === "porcentaje" ? "Descuento (%)" : "Descuento ($)"}
                    </label>
                    <input
                      type="number"
                      value={form.valor}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, valor: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                      placeholder={form.tipo === "porcentaje" ? "10" : "1000"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                      Mínimo de compra ($)
                    </label>
                    <input
                      type="number"
                      value={form.minimo}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, minimo: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                      Descuento máximo ($)
                    </label>
                    <input
                      type="number"
                      value={form.maximo}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, maximo: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                      placeholder="0 = sin límite"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                      Vencimiento
                    </label>
                    <input
                      type="date"
                      value={form.vencimiento}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, vencimiento: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 cursor-pointer">
                  <span className="text-sm font-medium text-[#1F2937]">Activo</span>
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, activo: e.target.checked }))
                    }
                    className="w-4 h-4 text-[#31D3A9] focus:ring-[#31D3A9]/30"
                  />
                </label>
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
                  disabled={saving || !form.codigo.trim()}
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
                Eliminar cupón
              </h3>
              <p className="text-sm text-[#6B7280] mb-6">
                ¿Estás seguro de eliminar el cupón{" "}
                <span className="font-semibold text-[#1F2937]">
                  {cupones.find((c) => c.id === deleteId)?.codigo}
                </span>
                ?
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
