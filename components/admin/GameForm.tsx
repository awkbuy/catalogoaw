"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Upload, X } from "lucide-react";
import ImageWithProgress from "@/components/ImageWithProgress";
import { sileo } from "sileo";
import { uploadImage } from "@/lib/upload-image";
import { useProgress } from "@/lib/progress-context";

interface Categoria {
  id: string;
  nombre: string;
}

interface GameData {
  id?: string;
  nombre: string;
  slug: string;
  descripcion: string;
  categoriaId: string;
  categoriaIds?: string[];
  jugadoresMin: string;
  jugadoresMax: string;
  duracion: string;
  edad: string;
  dificultad: string;
  precioFinalVenta: string;
  descuento: string;
  imagen: string;
  integrarVideo: boolean;
  videoUrl: string;
  estado: string;
  destacado: boolean;
  nuevo: boolean;
  disponibleVenta: boolean;
  disponibleMesa: boolean;
  orden: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonical: string;
  imagenAlt: string;
  descripcionAccesible: string;
  resumenIA: string;
}

interface GameFormProps {
  initialData?: GameData;
  categorias: Categoria[];
  mode: "create" | "edit";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const defaultData: GameData = {
  nombre: "",
  slug: "",
  descripcion: "",
  categoriaId: "",
  categoriaIds: [],
  jugadoresMin: "",
  jugadoresMax: "",
  duracion: "",
  edad: "",
  dificultad: "",
  precioFinalVenta: "",
  descuento: "",
  imagen: "",
  integrarVideo: false,
  videoUrl: "",
  estado: "Disponible",
  destacado: false,
  nuevo: false,
  disponibleVenta: false,
  disponibleMesa: false,
  orden: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  canonical: "",
  imagenAlt: "",
  descripcionAccesible: "",
  resumenIA: "",
};

export default function GameForm({
  initialData,
  categorias,
  mode,
}: GameFormProps) {
  const router = useRouter();
  const { start, done } = useProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<GameData>(() =>
    initialData
      ? {
          ...initialData,
          categoriaIds:
            initialData.categoriaIds && initialData.categoriaIds.length > 0
              ? initialData.categoriaIds
              : initialData.categoriaId
                ? [initialData.categoriaId]
                : [],
        }
      : defaultData
  );
  const [autoSlug, setAutoSlug] = useState(!initialData);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tieneDescuento, setTieneDescuento] = useState<boolean>(() =>
    initialData ? Number(initialData.descuento) > 0 : false
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "nombre" && autoSlug) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const toggleCategoria = (id: string) => {
    setForm((prev) => {
      const current = prev.categoriaIds ?? [];
      const next = current.includes(id)
        ? current.filter((c) => c !== id)
        : [...current, id];
      return { ...prev, categoriaIds: next };
    });
  };

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((prev) => {
      const current = prev.categoriaIds ?? [];
      const next = value && !current.includes(value) ? [...current, value] : current;
      return { ...prev, categoriaId: value, categoriaIds: next };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    start();
    try {
      const result = await uploadImage(file);
      if ("url" in result) {
        setForm((prev) => ({ ...prev, imagen: result.url }));
      } else {
        sileo.error({
          title: "Error al subir la imagen",
          description: result.error,
        });
      }
    } finally {
      setUploading(false);
      done();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    start();

    try {
      const url =
        mode === "create"
          ? "/api/admin/juegos"
          : `/api/admin/juegos/${form.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const payload = {
        ...form,
        categoriaIds: form.categoriaIds ?? [],
        jugadoresMin: Number(form.jugadoresMin) || 1,
        jugadoresMax: Number(form.jugadoresMax) || 1,
        descuento: tieneDescuento ? Number(form.descuento) || 0 : 0,
        orden: Number(form.orden) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      router.push("/games");
      router.refresh();
    } catch (err: unknown) {
      sileo.error({ title: err instanceof Error ? err.message : "Error al guardar el juego" });
    } finally {
      setSaving(false);
      done();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-4">
              Información básica
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="Nombre del juego"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    handleChange(e);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="url-del-juego"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all resize-none"
                  placeholder="Describe el juego..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-4">
              Detalles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Categoría principal *
                </label>
                <select
                  name="categoriaId"
                  value={form.categoriaId}
                  onChange={handleCategoriaChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Categorías adicionales
                </label>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((c) => {
                    const selected = (form.categoriaIds ?? []).includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCategoria(c.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          selected
                            ? "border-[#31D3A9] bg-[#31D3A9]/10 text-[#31D3A9]"
                            : "border-[#E5E7EB] bg-[#FAFAFA] text-[#6B7280] hover:border-[#31D3A9]/30 hover:text-[#1F2937]"
                        }`}
                      >
                        {c.nombre}
                        {selected && <span className="text-[#31D3A9]">✓</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[11px] text-[#9CA3AF]">
                  Un juego puede pertenecer a más de una categoría.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Jugadores min
                  </label>
                  <input
                    type="number"
                    name="jugadoresMin"
                    value={form.jugadoresMin}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Jugadores max
                  </label>
                  <input
                    type="number"
                    name="jugadoresMax"
                    value={form.jugadoresMax}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Duración
                </label>
                <input
                  type="text"
                  name="duracion"
                  value={form.duracion}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="30-60 min"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Edad
                </label>
                <input
                  type="text"
                  name="edad"
                  value={form.edad}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="8+"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Dificultad
                </label>
                <select
                  name="dificultad"
                  value={form.dificultad}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Fácil">Fácil</option>
                  <option value="Media">Media</option>
                  <option value="Difícil">Difícil</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Estado
                </label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Consultar">Consultar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Orden
                </label>
                <input
                  type="number"
                  name="orden"
                  value={form.orden}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-4">
              Precios
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Precio Final de Venta
                </label>
                <input
                  type="text"
                  name="precioFinalVenta"
                  value={form.precioFinalVenta}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="10.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Descuento
                </label>
                <div className="flex rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setTieneDescuento(false)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !tieneDescuento
                        ? "bg-[#31D3A9] text-[#0B3B30]"
                        : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setTieneDescuento(true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tieneDescuento
                        ? "bg-[#31D3A9] text-[#0B3B30]"
                        : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
                    }`}
                  >
                    Sí
                  </button>
                </div>
              </div>
            </div>
            {tieneDescuento && (
              <div className="mt-4 sm:max-w-[220px]">
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Descuento %
                </label>
                <input
                  type="number"
                  name="descuento"
                  value={form.descuento}
                  onChange={handleChange}
                  min={0}
                  max={100}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="Ej. 20"
                />
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-1">
              SEO
            </h3>
            <p className="text-[11px] text-[#9CA3AF] mb-4">
              Si dejás estos campos vacíos, se generan automáticamente a partir del juego.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Título SEO
                </label>
                <input
                  type="text"
                  name="seoTitle"
                  value={form.seoTitle}
                  onChange={handleChange}
                  maxLength={70}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="Ej. Catan | Juego de mesa de estrategia en Mendoza"
                />
                <p className="mt-1 text-[11px] text-[#9CA3AF]">
                  Recomendado: hasta 60 caracteres.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Descripción SEO
                </label>
                <textarea
                  name="seoDescription"
                  value={form.seoDescription}
                  onChange={handleChange}
                  rows={3}
                  maxLength={160}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all resize-none"
                  placeholder="Resumen pensado para los resultados de búsqueda"
                />
                <p className="mt-1 text-[11px] text-[#9CA3AF]">
                  Recomendado: entre 120 y 160 caracteres.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Palabras clave
                </label>
                <input
                  type="text"
                  name="seoKeywords"
                  value={form.seoKeywords}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="catan, juego de mesa, estrategia, Mendoza"
                />
                <p className="mt-1 text-[11px] text-[#9CA3AF]">
                  Separadas por comas.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  URL canónica personalizada
                </label>
                <input
                  type="text"
                  name="canonical"
                  value={form.canonical}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="https://ejemplo.com/catan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Texto alternativo de la imagen
                </label>
                <input
                  type="text"
                  name="imagenAlt"
                  value={form.imagenAlt}
                  onChange={handleChange}
                  maxLength={125}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="Ej. Caja de Catan con sus fichas y tablero"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Descripción accesible
                </label>
                <textarea
                  name="descripcionAccesible"
                  value={form.descripcionAccesible}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all resize-none"
                  placeholder="Descripción corta y clara del juego"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Resumen
                </label>
                <textarea
                  name="resumenIA"
                  value={form.resumenIA}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all resize-none"
                  placeholder="Resumen breve del juego para mostrar en la página"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-4">
              Imagen
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {form.imagen ? (
              <div className="relative">
                <ImageWithProgress
                  src={form.imagen}
                  alt="Preview"
                  width={300}
                  height={300}
                  className="w-full aspect-square rounded-xl overflow-hidden bg-[#E5E7EB]"
                  imgClassName="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, imagen: "" }))}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center shadow-sm"
                >
                  <X className="w-4 h-4 text-[#6B7280]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full aspect-square rounded-xl border-2 border-dashed border-[#E5E7EB] hover:border-[#31D3A9]/50 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#31D3A9]" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-[#6B7280]" />
                    <span className="text-xs text-[#6B7280]">
                      Subir imagen
                    </span>
                  </>
                )}
              </button>
            )}
            <p className="mt-3 text-[11px] text-[#9CA3AF] text-center">
              Tamaño recomendado: 800×800px o superior · Se convertirá automáticamente a WebP
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-4">
              Video
            </h3>
            <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
              Integrar video
            </label>
            <div className="flex rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-1 gap-1">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, integrarVideo: false }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !form.integrarVideo
                    ? "bg-[#31D3A9] text-[#0B3B30]"
                    : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, integrarVideo: true }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.integrarVideo
                    ? "bg-[#31D3A9] text-[#0B3B30]"
                    : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
                }`}
              >
                Sí
              </button>
            </div>
            {form.integrarVideo && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  URL del video (YouTube)
                </label>
                <input
                  type="text"
                  name="videoUrl"
                  value={form.videoUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="mt-2 text-[11px] text-[#9CA3AF]">
                  Acepta links de YouTube (watch, youtu.be, shorts o embed).
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-4">
              Opciones
            </h3>
            <div className="space-y-3">
              {[
                { name: "destacado", label: "Destacado" },
                { name: "nuevo", label: "Nuevo" },
                { name: "disponibleVenta", label: "Disponible en venta" },
                { name: "disponibleMesa", label: "Disponible en mesa" },
              ].map((opt) => (
                <label
                  key={opt.name}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name={opt.name}
                    checked={form[opt.name as keyof GameData] as boolean}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-[#E5E7EB] text-[#31D3A9] focus:ring-[#31D3A9]/30"
                  />
                  <span className="text-sm text-[#1F2937]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#1F2937] hover:bg-[#FAFAFA] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#31D3A9] text-[#0B3B30] text-sm font-medium hover:bg-[#2bc49b] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "create" ? (
                "Crear"
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
