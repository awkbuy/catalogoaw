"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, Check, Search } from "lucide-react";
import ImageWithProgress from "@/components/ImageWithProgress";
import { sileo } from "sileo";
import { uploadImage } from "@/lib/upload-image";
import { useProgress } from "@/lib/progress-context";
import { slugifyLanding, parseGameIds } from "@/lib/landings";
import { adminHref } from "@/lib/admin-path";
import { useAdminPath } from "@/components/admin/AdminPathProvider";

interface GameOption {
  id: string;
  nombre: string;
  imagen: string;
  categoria: { nombre: string };
}

interface LandingData {
  id?: string;
  slug: string;
  title: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  bannerColor: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonical: string;
  gameIds: string;
  isActive: boolean;
  sortOrder: string;
}

interface LandingFormProps {
  initialData?: LandingData;
  games: GameOption[];
  mode: "create" | "edit";
}

const defaultData: LandingData = {
  slug: "",
  title: "",
  description: "",
  heroTitle: "",
  heroDescription: "",
  heroImage: "",
  bannerColor: "#31D3A9",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  canonical: "",
  gameIds: "[]",
  isActive: true,
  sortOrder: "0",
};

const ACCENT_COLORS = [
  "#31D3A9",
  "#FF7BAC",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#0B3B30",
];

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-[#6B7280] mt-1">{hint}</p> : null}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-sm text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all";

export default function LandingForm({
  initialData,
  games,
  mode,
}: LandingFormProps) {
  const router = useRouter();
  const adminPath = useAdminPath();
  const { start, done } = useProgress();
  const [form, setForm] = useState<LandingData>(() =>
    initialData
      ? { ...initialData, sortOrder: String(initialData.sortOrder) }
      : defaultData
  );
  const [autoSlug, setAutoSlug] = useState(!initialData);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gameSearch, setGameSearch] = useState("");

  const selectedIds = parseGameIds(form.gameIds);
  const selectedSet = new Set(selectedIds);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "title" && autoSlug) {
        next.slug = slugifyLanding(value);
      }
      return next;
    });
  };

  const toggleGame = (id: string) => {
    setForm((prev) => {
      const current = parseGameIds(prev.gameIds);
      const next = current.includes(id)
        ? current.filter((g) => g !== id)
        : [...current, id];
      return { ...prev, gameIds: JSON.stringify(next) };
    });
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    start();
    try {
      const result = await uploadImage(file);
      if ("url" in result) {
        setForm((prev) => ({ ...prev, heroImage: result.url }));
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

  const filteredGames = games.filter(
    (g) =>
      !gameSearch.trim() ||
      g.nombre.toLowerCase().includes(gameSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    start();

    const slug = form.slug.trim() || slugifyLanding(form.title);
    if (!slug) {
      sileo.error({ title: "El slug es obligatorio" });
      setSaving(false);
      done();
      return;
    }

    const payload = {
      ...form,
      slug,
      sortOrder: Number(form.sortOrder) || 0,
    };

    try {
      const url =
        mode === "create"
          ? "/api/admin/landings"
          : `/api/admin/landings/${form.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      router.push(adminHref("/landings", adminPath));
      router.refresh();
    } catch (err: unknown) {
      sileo.error({
        title: err instanceof Error ? err.message : "Error al guardar la landing",
      });
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
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-5">
            <h2 className="text-base font-bold text-[#1F2937]">
              Información general
            </h2>
            <Field label="Título de la landing">
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ej: Cyber Monday Wolfie Room"
                className={inputClass}
                required
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Slug (URL pública)" hint={`/${form.slug || "..."}`}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="slug"
                    value={form.slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      handleChange(e);
                    }}
                    placeholder="cyber-monday"
                    className={inputClass}
                    required
                  />
                </div>
              </Field>
              <Field label="Orden">
                <input
                  type="number"
                  name="sortOrder"
                  value={form.sortOrder}
                  onChange={handleChange}
                  className={inputClass}
                  min={0}
                />
              </Field>
            </div>
            <Field label="Descripción">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                placeholder="Descripción corta de la campaña"
                className={`${inputClass} resize-y`}
              />
            </Field>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-5">
            <h2 className="text-base font-bold text-[#1F2937]">Hero</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Título del hero">
                <input
                  type="text"
                  name="heroTitle"
                  value={form.heroTitle}
                  onChange={handleChange}
                  placeholder="Ej: Descuentos hasta 40%"
                  className={inputClass}
                />
              </Field>
              <Field label="Descripción del hero">
                <input
                  type="text"
                  name="heroDescription"
                  value={form.heroDescription}
                  onChange={handleChange}
                  placeholder="Ej: Los mejores juegos de mesa al mejor precio"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Imagen de fondo del hero">
              <div className="flex items-center gap-3">
                {form.heroImage ? (
                  <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-[#E5E7EB] flex-shrink-0">
                    <ImageWithProgress
                      src={form.heroImage}
                      alt="Hero de la landing"
                      fill
                      className="absolute inset-0"
                      imgClassName="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, heroImage: "" }))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                      title="Quitar imagen"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-16 rounded-xl bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280] flex-shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                )}
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#1F2937] hover:bg-[#FAFAFA] cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-[#6B7280]" />
                  {uploading ? "Subiendo..." : "Subir imagen"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </Field>

            <Field label="Color de acento">
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, bannerColor: color }))}
                    className={`w-9 h-9 rounded-xl transition-transform ${
                      form.bannerColor === color
                        ? "ring-2 ring-[#1F2937] ring-offset-2 scale-105"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#6B7280] cursor-pointer hover:bg-[#FAFAFA]">
                  <input
                    type="color"
                    value={form.bannerColor}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, bannerColor: e.target.value }))
                    }
                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                  />
                  Personalizado
                </label>
              </div>
            </Field>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-5">
            <h2 className="text-base font-bold text-[#1F2937]">SEO</h2>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Título SEO">
                <input
                  type="text"
                  name="seoTitle"
                  value={form.seoTitle}
                  onChange={handleChange}
                  placeholder="Título para Google (si se deja vacío usa el título)"
                  className={inputClass}
                />
              </Field>
              <Field label="Descripción SEO">
                <textarea
                  name="seoDescription"
                  value={form.seoDescription}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Descripción para Google"
                  className={`${inputClass} resize-y`}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Keywords SEO (separadas por coma)">
                  <input
                    type="text"
                    name="seoKeywords"
                    value={form.seoKeywords}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </Field>
                <Field label="URL canónica (opcional)">
                  <input
                    type="text"
                    name="canonical"
                    value={form.canonical}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-5">
            <h2 className="text-base font-bold text-[#1F2937]">
              Juegos de la landing
            </h2>
            <p className="text-sm text-[#6B7280]">
              {selectedIds.length} juego{selectedIds.length !== 1 ? "s" : ""}{" "}
              seleccionado{selectedIds.length !== 1 ? "s" : ""}
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                value={gameSearch}
                onChange={(e) => setGameSearch(e.target.value)}
                placeholder="Buscar juegos para agregar..."
                className={`${inputClass} pl-9`}
              />
            </div>
            <div className="max-h-72 overflow-y-auto border border-[#E5E7EB] rounded-xl divide-y divide-[#E5E7EB]/50">
              {filteredGames.length === 0 && (
                <div className="py-8 text-center text-sm text-[#6B7280]">
                  No se encontraron juegos
                </div>
              )}
              {filteredGames.map((game) => {
                const checked = selectedSet.has(game.id);
                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => toggleGame(game.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      checked ? "bg-[#31D3A9]/5" : "hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked
                          ? "bg-[#31D3A9] border-[#31D3A9] text-white"
                          : "border-[#D1D5DB] bg-white"
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5" />}
                    </span>
                    {game.imagen ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#E5E7EB] flex-shrink-0">
                        <ImageWithProgress
                          src={game.imagen}
                          alt={game.nombre}
                          width={40}
                          height={40}
                          imgClassName="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#E5E7EB]/50 flex items-center justify-center text-[#6B7280] text-xs flex-shrink-0">
                        —
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1F2937] truncate">
                        {game.nombre}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        {game.categoria.nombre}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h2 className="text-base font-bold text-[#1F2937] mb-4">
              Publicación
            </h2>
            <Field label="Estado">
              <div className="flex rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isActive: true }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.isActive
                      ? "bg-[#31D3A9] text-[#0B3B30]"
                      : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
                  }`}
                >
                  Activa
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isActive: false }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !form.isActive
                      ? "bg-[#E5E7EB] text-[#6B7280]"
                      : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
                  }`}
                >
                  Inactiva
                </button>
              </div>
            </Field>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sticky top-24">
            <h2 className="text-base font-bold text-[#1F2937] mb-2">
              Vista previa
            </h2>
            <p className="text-xs text-[#6B7280] mb-4">
              Las landing inactivas no son accesibles públicamente.
            </p>
            <div className="rounded-xl overflow-hidden border border-[#E5E7EB]">
              <div
                className="h-20 relative flex flex-col items-center justify-center px-4 text-center"
                style={{ backgroundColor: form.bannerColor }}
              >
                {form.heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.heroImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="relative z-10 bg-black/40 rounded-lg px-3 py-1.5">
                  <p className="text-sm font-bold text-white truncate">
                    {form.heroTitle || form.title || "Título de la landing"}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-white">
                <p className="text-xs text-[#6B7280]">
                  {selectedIds.length} juego
                  {selectedIds.length !== 1 ? "s" : ""} en la landing
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#31D3A9] text-[#0B3B30] text-sm font-medium hover:bg-[#2bc49b] disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "create" ? "Crear landing" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
