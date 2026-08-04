"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import { sileo } from "sileo";
import PaymentMethodIcon, { PAYMENT_ICONS, BRAND_ICON_KEYS } from "@/components/PaymentMethodIcon";

interface MedioPago {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  activo: boolean;
  orden: number;
  promocional: boolean;
  createdAt: string;
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        checked ? "bg-[#31D3A9]" : "bg-[#E5E7EB]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

export default function PagosPage() {
  const [medios, setMedios] = useState<MedioPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    icono: "credit_card",
    activo: true,
    promocional: false,
    orden: 1,
  });

  useEffect(() => {
    fetch("/api/admin/pagos")
      .then((r) => r.json())
      .then((data) => {
        setMedios(data);
        setLoading(false);
      });
  }, []);

  const sorted = [...medios].sort((a, b) => a.orden - b.orden);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      titulo: "",
      descripcion: "",
      icono: "credit_card",
      activo: true,
      promocional: false,
      orden: medios.length + 1,
    });
    setShowModal(true);
  };

  const openEdit = (m: MedioPago) => {
    setEditingId(m.id);
    setForm({
      titulo: m.titulo,
      descripcion: m.descripcion,
      icono: m.icono,
      activo: m.activo,
      promocional: m.promocional,
      orden: m.orden,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim() && !form.descripcion.trim()) {
      sileo.error({ title: "Ingresá un título o una descripción" });
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/pagos/${editingId}` : "/api/admin/pagos";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          orden: Number(form.orden) || 1,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (editingId) {
          setMedios((prev) =>
            prev.map((m) => (m.id === editingId ? { ...m, ...data } : m))
          );
          sileo.success({ title: "Medio de pago actualizado" });
        } else {
          setMedios((prev) => [...prev, data]);
          sileo.success({ title: "Medio de pago creado" });
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
      const res = await fetch(`/api/admin/pagos/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setMedios((prev) => prev.filter((m) => m.id !== deleteId));
        setDeleteId(null);
        sileo.success({ title: "Medio de pago eliminado" });
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

  const handleToggleActive = async (m: MedioPago) => {
    try {
      const res = await fetch(`/api/admin/pagos/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...m, activo: !m.activo }),
      });
      const data = await res.json();
      if (res.ok) {
        setMedios((prev) => prev.map((x) => (x.id === m.id ? { ...x, activo: data.activo } : x)));
      } else {
        sileo.error({ title: data.error || "Error al actualizar" });
      }
    } catch {
      sileo.error({ title: "Error al actualizar" });
    }
  };

  const handleReorder = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length || reordering) return;
    setReordering(true);
    try {
      const ids = sorted.map((m) => m.id);
      [ids[index], ids[target]] = [ids[target], ids[index]];
      const ordenMap = new Map(ids.map((id, i) => [id, i + 1]));
      setMedios((prev) => prev.map((m) => ({ ...m, orden: ordenMap.get(m.id) || m.orden })));
      const res = await fetch("/api/admin/pagos/reordenar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        sileo.error({ title: "Error al reordenar" });
      }
    } catch {
      sileo.error({ title: "Error al reordenar" });
    } finally {
      setReordering(false);
    }
  };

  const renderTipo = (m: MedioPago) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        m.promocional
          ? "bg-amber-50 text-amber-600"
          : "bg-[#31D3A9]/10 text-[#31D3A9]"
      }`}
    >
      {m.promocional && <Sparkles className="w-3 h-3" />}
      {m.promocional ? "Promocional" : "Medio"}
    </span>
  );

  const renderOrdenControls = (m: MedioPago, index: number) => (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => handleReorder(index, -1)}
        disabled={index === 0 || reordering}
        title="Subir"
        className="w-7 h-7 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280] hover:text-[#31D3A9] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#6B7280] transition-colors"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleReorder(index, 1)}
        disabled={index === sorted.length - 1 || reordering}
        title="Bajar"
        className="w-7 h-7 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280] hover:text-[#31D3A9] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#6B7280] transition-colors"
      >
        <ArrowDown className="w-4 h-4" />
      </button>
    </div>
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
          <h1 className="text-2xl font-bold text-[#1F2937]">Medios de Pago</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {medios.length} {medios.length === 1 ? "medio" : "medios"} ·{" "}
            {medios.filter((m) => m.activo).length} activos
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#31D3A9] text-[#0B3B30] text-sm font-medium hover:bg-[#2bc49b] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo medio
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Orden
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Medio
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Mensaje
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Tipo
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
              {sorted.map((m, index) => (
                <tr
                  key={m.id}
                  className="border-b border-[#E5E7EB]/50 hover:bg-[#FAFAFA] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#9CA3AF] w-4">
                        {index + 1}
                      </span>
                      {renderOrdenControls(m, index)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#31D3A9]/10 flex items-center justify-center">
                        <PaymentMethodIcon icono={m.icono} size={16} className="text-[#31D3A9]" />
                      </span>
                      <span className="text-sm font-semibold text-[#1F2937]">
                        {m.titulo || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280] max-w-[260px] truncate">
                    {m.descripcion || "—"}
                  </td>
                  <td className="px-4 py-3">{renderTipo(m)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={m.activo}
                        onChange={() => handleToggleActive(m)}
                      />
                      <span className={`text-xs font-medium ${m.activo ? "text-[#31D3A9]" : "text-[#9CA3AF]"}`}>
                        {m.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(m)}
                        className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280] hover:text-[#31D3A9] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(m.id)}
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
          {sorted.map((m, index) => (
            <div key={m.id} className="p-4">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="w-8 h-8 rounded-lg bg-[#31D3A9]/10 flex items-center justify-center">
                  <PaymentMethodIcon icono={m.icono} size={16} className="text-[#31D3A9]" />
                </span>
                <span className="text-sm font-semibold text-[#1F2937] flex-1">
                  {m.titulo || "—"}
                </span>
                {renderTipo(m)}
              </div>
              {m.descripcion && (
                <p className="text-xs text-[#6B7280]">{m.descripcion}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <Toggle checked={m.activo} onChange={() => handleToggleActive(m)} />
                  <span className={`text-xs font-medium ${m.activo ? "text-[#31D3A9]" : "text-[#9CA3AF]"}`}>
                    {m.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {renderOrdenControls(m, index)}
                  <button
                    onClick={() => openEdit(m)}
                    className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(m.id)}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-[#6B7280] hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#1F2937]">
                  {editingId ? "Editar medio de pago" : "Nuevo medio de pago"}
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
                    Título *
                  </label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
                    maxLength={80}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                    placeholder="Ej: Tarjetas de débito y crédito"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                    maxLength={200}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all resize-none"
                    placeholder="Ej: Aceptamos tarjetas de débito y crédito."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Ícono
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(PAYMENT_ICONS)
                      .filter((key) => !BRAND_ICON_KEYS.includes(key))
                      .map((key) => {
                        const selected = form.icono === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, icono: key }))}
                            title={key}
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                              selected
                                ? "border-[#31D3A9] bg-[#31D3A9]/10 text-[#31D3A9]"
                                : "border-[#E5E7EB] bg-[#FAFAFA] text-[#6B7280] hover:border-[#31D3A9]/40 hover:text-[#31D3A9]"
                            }`}
                          >
                            <PaymentMethodIcon icono={key} size={18} />
                          </button>
                        );
                      })}
                  </div>
                  <p className="text-[11px] font-medium text-[#9CA3AF] mt-3 mb-1.5">Marcas</p>
                  <div className="flex flex-wrap gap-2">
                    {BRAND_ICON_KEYS.map((key) => {
                      const selected = form.icono === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, icono: key }))}
                          title={key}
                          className={`w-10 h-10 rounded-xl border bg-[#FAFAFA] flex items-center justify-center transition-all ${
                            selected
                              ? "border-[#31D3A9] ring-2 ring-[#31D3A9]/20"
                              : "border-[#E5E7EB] hover:border-[#31D3A9]/40"
                          }`}
                        >
                          <PaymentMethodIcon icono={key} size={20} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                      Orden
                    </label>
                    <input
                      type="number"
                      value={form.orden}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, orden: Number(e.target.value) || 1 }))
                      }
                      min={1}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 cursor-pointer w-full">
                      <span className="text-sm font-medium text-[#1F2937]">Activo</span>
                      <Toggle
                        checked={form.activo}
                        onChange={() => setForm((prev) => ({ ...prev, activo: !prev.activo }))}
                      />
                    </label>
                  </div>
                </div>

                <label
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer ${
                    form.promocional
                      ? "border-amber-200 bg-amber-50"
                      : "border-[#E5E7EB] bg-[#FAFAFA]"
                  }`}
                >
                  <span className="text-sm font-medium text-[#1F2937] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Marcar como promocional
                  </span>
                  <Toggle
                    checked={form.promocional}
                    onChange={() => setForm((prev) => ({ ...prev, promocional: !prev.promocional }))}
                  />
                </label>
                <p className="text-[11px] text-[#9CA3AF] -mt-1">
                  Los mensajes promocionales se destacan como badge en las fichas de producto.
                </p>
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
                  disabled={saving || (!form.titulo.trim() && !form.descripcion.trim())}
                  className="flex-1 py-2.5 rounded-xl bg-[#31D3A9] text-[#0B3B30] text-sm font-medium hover:bg-[#2bc49b] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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
                Eliminar medio de pago
              </h3>
              <p className="text-sm text-[#6B7280] mb-6">
                ¿Estás seguro de eliminar{" "}
                <span className="font-semibold text-[#1F2937]">
                  {medios.find((m) => m.id === deleteId)?.titulo ||
                    "este medio de pago"}
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
