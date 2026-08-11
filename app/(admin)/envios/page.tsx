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
  Truck,
} from "lucide-react";
import { sileo } from "sileo";
import { useProgress } from "@/lib/progress-context";
import { formatPrice } from "@/lib/format";

interface ZonaEnvio {
  id: string;
  name: string;
  cost: number;
  freeFrom: number;
  consultar: boolean;
  active: boolean;
  order: number;
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

export default function EnviosPage() {
  const { start, done } = useProgress();
  const [zonas, setZonas] = useState<ZonaEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);

  const [form, setForm] = useState({
    name: "",
    cost: "",
    freeFrom: "",
    consultar: false,
    active: true,
    order: 1,
  });

  useEffect(() => {
    fetch("/api/admin/envios")
      .then((r) => r.json())
      .then((data) => {
        setZonas(data);
        setLoading(false);
      });
  }, []);

  const sorted = [...zonas].sort((a, b) => a.order - b.order);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      cost: "",
      freeFrom: "",
      consultar: false,
      active: true,
      order: zonas.length + 1,
    });
    setShowModal(true);
  };

  const openEdit = (z: ZonaEnvio) => {
    setEditingId(z.id);
    setForm({
      name: z.name,
      cost: String(z.cost),
      freeFrom: String(z.freeFrom),
      consultar: z.consultar,
      active: z.active,
      order: z.order,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      sileo.error({ title: "Ingresá un nombre para la zona" });
      return;
    }
    setSaving(true);
    start();
    try {
      const url = editingId ? `/api/admin/envios/${editingId}` : "/api/admin/envios";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          cost: Number(form.cost) || 0,
          freeFrom: Number(form.freeFrom) || 0,
          consultar: form.consultar,
          order: Number(form.order) || 1,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (editingId) {
          setZonas((prev) =>
            prev.map((z) => (z.id === editingId ? { ...z, ...data } : z))
          );
          sileo.success({ title: "Zona de envío actualizada" });
        } else {
          setZonas((prev) => [...prev, data]);
          sileo.success({ title: "Zona de envío creada" });
        }
        setShowModal(false);
      } else {
        sileo.error({ title: data.error || "Error al guardar" });
      }
    } catch {
      sileo.error({ title: "Error al guardar" });
    } finally {
      done();
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    start();
    try {
      const res = await fetch(`/api/admin/envios/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setZonas((prev) => prev.filter((z) => z.id !== deleteId));
        setDeleteId(null);
        sileo.success({ title: "Zona de envío eliminada" });
      } else {
        const data = await res.json();
        sileo.error({ title: data.error || "Error al eliminar" });
      }
    } catch {
      sileo.error({ title: "Error al eliminar" });
    } finally {
      done();
      setDeleting(false);
    }
  };

  const handleToggleActive = async (z: ZonaEnvio) => {
    start();
    try {
      const res = await fetch(`/api/admin/envios/${z.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...z, active: !z.active }),
      });
      const data = await res.json();
      if (res.ok) {
        setZonas((prev) => prev.map((x) => (x.id === z.id ? { ...x, active: data.active } : x)));
      } else {
        sileo.error({ title: data.error || "Error al actualizar" });
      }
    } catch {
      sileo.error({ title: "Error al actualizar" });
    } finally {
      done();
    }
  };

  const handleReorder = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length || reordering) return;
    setReordering(true);
    start();
    try {
      const ids = sorted.map((z) => z.id);
      [ids[index], ids[target]] = [ids[target], ids[index]];
      const ordenMap = new Map(ids.map((id, i) => [id, i + 1]));
      setZonas((prev) => prev.map((z) => ({ ...z, order: ordenMap.get(z.id) || z.order })));
      const res = await fetch("/api/admin/envios/reordenar", {
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
      done();
      setReordering(false);
    }
  };

  const renderOrdenControls = (z: ZonaEnvio, index: number) => (
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
          <h1 className="text-2xl font-bold text-[#1F2937]">Zonas de Envío</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {zonas.length} {zonas.length === 1 ? "zona" : "zonas"} ·{" "}
            {zonas.filter((z) => z.active).length} activas
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#31D3A9] text-[#0B3B30] text-sm font-medium hover:bg-[#2bc49b] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva zona
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
                  Zona
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Costo
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Gratis desde
                </th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-4 py-3">
                  Consultar
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
              {sorted.map((z, index) => (
                <tr
                  key={z.id}
                  className="border-b border-[#E5E7EB]/50 hover:bg-[#FAFAFA] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#9CA3AF] w-4">
                        {index + 1}
                      </span>
                      {renderOrdenControls(z, index)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#31D3A9]/10 flex items-center justify-center">
                        <Truck size={16} className="text-[#31D3A9]" />
                      </span>
                      <span className="text-sm font-semibold text-[#1F2937]">
                        {z.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1F2937]">
                    {z.cost === 0 ? (
                      <span className="inline-flex rounded-full bg-[#31D3A9]/10 px-2 py-0.5 text-[11px] font-semibold text-[#31D3A9]">
                        Gratis
                      </span>
                    ) : (
                      formatPrice(z.cost)
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B7280]">
                    {z.freeFrom > 0 ? formatPrice(z.freeFrom) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {z.consultar ? (
                      <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                        Consultar monto
                      </span>
                    ) : (
                      <span className="text-sm text-[#9CA3AF]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={z.active}
                        onChange={() => handleToggleActive(z)}
                      />
                      <span className={`text-xs font-medium ${z.active ? "text-[#31D3A9]" : "text-[#9CA3AF]"}`}>
                        {z.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(z)}
                        className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280] hover:text-[#31D3A9] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(z.id)}
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

        <div className="md:hidden divide-y divide-[#E5E7EB]/50">
          {sorted.map((z, index) => (
            <div key={z.id} className="p-4">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="w-8 h-8 rounded-lg bg-[#31D3A9]/10 flex items-center justify-center">
                  <Truck size={16} className="text-[#31D3A9]" />
                </span>
                <span className="text-sm font-semibold text-[#1F2937] flex-1">
                  {z.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                <span>
                  Costo:{" "}
                  {z.consultar ? (
                    <span className="font-semibold text-amber-600">Consultar</span>
                  ) : z.cost === 0 ? (
                    <span className="font-semibold text-[#31D3A9]">Gratis</span>
                  ) : (
                    formatPrice(z.cost)
                  )}
                </span>
                {z.freeFrom > 0 && (
                  <span>Gratis desde {formatPrice(z.freeFrom)}</span>
                )}
              </div>
              {z.consultar && (
                <p className="mt-1 text-[11px] font-medium text-amber-600">
                  Envío sin tarifa publicada, se coordina por WhatsApp
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <Toggle checked={z.active} onChange={() => handleToggleActive(z)} />
                  <span className={`text-xs font-medium ${z.active ? "text-[#31D3A9]" : "text-[#9CA3AF]"}`}>
                    {z.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {renderOrdenControls(z, index)}
                  <button
                    onClick={() => openEdit(z)}
                    className="w-8 h-8 rounded-lg hover:bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(z.id)}
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
                  {editingId ? "Editar zona de envío" : "Nueva zona de envío"}
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
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    maxLength={80}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                    placeholder="Ej: Envío Mendoza"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                      Costo (ARS)
                    </label>
                    <input
                      type="number"
                      value={form.cost}
                      onChange={(e) => setForm((prev) => ({ ...prev, cost: e.target.value }))}
                      min={0}
                      disabled={form.consultar}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all disabled:opacity-50"
                      placeholder="0"
                    />
                    <p className="mt-1 text-[11px] text-[#9CA3AF]">
                      Dejá 0 para retiro o envío sin cargo.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                      Gratis desde (ARS)
                    </label>
                    <input
                      type="number"
                      value={form.freeFrom}
                      onChange={(e) => setForm((prev) => ({ ...prev, freeFrom: e.target.value }))}
                      min={0}
                      disabled={form.consultar}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all disabled:opacity-50"
                      placeholder="0"
                    />
                    <p className="mt-1 text-[11px] text-[#9CA3AF]">
                      Envío gratis cuando el subtotal supere este monto.
                    </p>
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 cursor-pointer w-full">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[#1F2937]">
                      Consultar monto
                    </span>
                    <span className="block text-[11px] text-[#9CA3AF]">
                      Envío sin tarifa publicada, se coordina por WhatsApp.
                    </span>
                  </span>
                  <Toggle
                    checked={form.consultar}
                    onChange={() => setForm((prev) => ({ ...prev, consultar: !prev.consultar }))}
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                      Orden
                    </label>
                    <input
                      type="number"
                      value={form.order}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, order: Number(e.target.value) || 1 }))
                      }
                      min={1}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 cursor-pointer w-full">
                      <span className="text-sm font-medium text-[#1F2937]">Activa</span>
                      <Toggle
                        checked={form.active}
                        onChange={() => setForm((prev) => ({ ...prev, active: !prev.active }))}
                      />
                    </label>
                  </div>
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
                  disabled={saving || !form.name.trim()}
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
                Eliminar zona de envío
              </h3>
              <p className="text-sm text-[#6B7280] mb-6">
                ¿Estás seguro de eliminar{" "}
                <span className="font-semibold text-[#1F2937]">
                  {zonas.find((z) => z.id === deleteId)?.name || "esta zona"}
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
