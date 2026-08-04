"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { sileo } from "sileo";

interface Settings {
  [key: string]: string;
}

interface FaqItem {
  pregunta: string;
  respuesta: string;
}

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all";
const textareaClass = `${inputClass} resize-none`;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-[#9CA3AF]">{hint}</p>}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </Field>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  maxLength,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        className={textareaClass}
      />
    </Field>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
        {label}
      </label>
      <div className="flex rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-1 gap-1 max-w-[240px]">
        <button
          type="button"
          onClick={() => onChange("true")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            value !== "false"
              ? "bg-[#31D3A9] text-[#0B3B30]"
              : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
          }`}
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => onChange("false")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === "false"
              ? "bg-[#31D3A9] text-[#0B3B30]"
              : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
      <h3 className="text-sm font-semibold text-[#1F2937] mb-1">{title}</h3>
      {description && (
        <p className="text-[11px] text-[#9CA3AF] mb-4">{description}</p>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function SeoPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const faq: FaqItem[] = (() => {
    try {
      const parsed = JSON.parse(settings.seoFaq || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const updateFaq = (next: FaqItem[]) => {
    handleChange("seoFaq", JSON.stringify(next));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        sileo.success({ title: "SEO guardado correctamente" });
      } else {
        sileo.error({ title: "Error al guardar" });
      }
    } catch {
      sileo.error({ title: "Error al guardar" });
    } finally {
      setSaving(false);
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
          <h1 className="text-2xl font-bold text-[#1F2937]">SEO</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Configuración de búsqueda, redes y datos estructurados
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#31D3A9] text-[#0B3B30] text-sm font-medium hover:bg-[#2bc49b] disabled:opacity-60 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Section
            title="General"
            description="Datos base del sitio para motores de búsqueda"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Nombre del sitio"
                value={settings.seoNombreSitio || ""}
                onChange={(v) => handleChange("seoNombreSitio", v)}
                placeholder="Wolfie Room"
              />
              <TextField
                label="URL del sitio"
                value={settings.seoUrl || ""}
                onChange={(v) => handleChange("seoUrl", v)}
                placeholder="https://wolfiesroom.com"
                hint="Usada para canónicas, sitemap y robots."
              />
              <TextField
                label="URL canónica por defecto"
                value={settings.seoCanonical || ""}
                onChange={(v) => handleChange("seoCanonical", v)}
                placeholder="https://wolfiesroom.com"
                hint="Si la dejás vacía, se usa la URL del sitio."
              />
              <TextField
                label="Idioma (locale)"
                value={settings.seoIdioma || ""}
                onChange={(v) => handleChange("seoIdioma", v)}
                placeholder="es_AR"
              />
              <TextField
                label="País"
                value={settings.seoPais || ""}
                onChange={(v) => handleChange("seoPais", v)}
                placeholder="AR"
              />
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Toggle
                  label="Permitir indexación"
                  value={settings.seoIndex || "true"}
                  onChange={(v) => handleChange("seoIndex", v)}
                />
                <Toggle
                  label="Permitir seguimiento de enlaces"
                  value={settings.seoFollow || "true"}
                  onChange={(v) => handleChange("seoFollow", v)}
                />
              </div>
            </div>
          </Section>

          <Section
            title="Meta tags por defecto"
            description="Se usan cuando una página no define los propios"
          >
            <TextField
              label="Título por defecto"
              value={settings.seoTitulo || ""}
              onChange={(v) => handleChange("seoTitulo", v)}
              placeholder="Wolfie Room - Juegos de mesa en Mendoza"
              hint="Recomendado: hasta 60 caracteres."
            />
            <TextArea
              label="Descripción por defecto"
              value={settings.seoDescripcion || ""}
              onChange={(v) => handleChange("seoDescripcion", v)}
              maxLength={160}
              placeholder="Descripción corta del negocio"
              hint="Recomendado: entre 120 y 160 caracteres."
            />
            <TextField
              label="Palabras clave"
              value={settings.seoKeywords || ""}
              onChange={(v) => handleChange("seoKeywords", v)}
              placeholder="juegos de mesa, Mendoza, ludoteca"
              hint="Separadas por comas."
            />
          </Section>

          <Section
            title="Open Graph (Facebook, WhatsApp, etc.)"
            description="Cómo se muestra el sitio al compartirse en redes"
          >
            <TextField
              label="Título OG"
              value={settings.seoOgTitle || ""}
              onChange={(v) => handleChange("seoOgTitle", v)}
              hint="Si se deja vacío, se usa el título por defecto."
            />
            <TextArea
              label="Descripción OG"
              value={settings.seoOgDescription || ""}
              onChange={(v) => handleChange("seoOgDescription", v)}
              maxLength={160}
              hint="Si se deja vacía, se usa la descripción por defecto."
            />
            <TextField
              label="Imagen OG (URL)"
              value={settings.seoOgImage || ""}
              onChange={(v) => handleChange("seoOgImage", v)}
              placeholder="https://.../og-image.jpg"
              hint="Tamaño recomendado: 1200×630px."
            />
          </Section>

          <Section
            title="Twitter / X Card"
            description="Cómo se muestra el sitio en X (Twitter)"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Field label="Tipo de tarjeta">
                  <select
                    value={settings.seoTwitterCard || "summary_large_image"}
                    onChange={(e) => handleChange("seoTwitterCard", e.target.value)}
                    className={inputClass}
                  >
                    <option value="summary">summary</option>
                    <option value="summary_large_image">summary_large_image</option>
                  </select>
                </Field>
              </div>
              <TextField
                label="Imagen Twitter (URL)"
                value={settings.seoTwitterImage || ""}
                onChange={(v) => handleChange("seoTwitterImage", v)}
                placeholder="https://.../twitter-image.jpg"
                hint="Si se deja vacía, se usa la imagen OG."
              />
            </div>
            <TextField
              label="Título Twitter"
              value={settings.seoTwitterTitle || ""}
              onChange={(v) => handleChange("seoTwitterTitle", v)}
              hint="Si se deja vacío, se usa el título OG."
            />
            <TextArea
              label="Descripción Twitter"
              value={settings.seoTwitterDescription || ""}
              onChange={(v) => handleChange("seoTwitterDescription", v)}
              maxLength={160}
              hint="Si se deja vacía, se usa la descripción OG."
            />
          </Section>

          <Section
            title="Preguntas frecuentes (FAQ)"
            description="Aparecen en los resultados de búsqueda y en la página de inicio"
          >
            <div className="space-y-3">
              {faq.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[#E5E7EB] p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B7280]">
                      Pregunta {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateFaq(faq.filter((_, i) => i !== index))
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      aria-label={`Eliminar pregunta ${index + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.pregunta}
                    onChange={(e) =>
                      updateFaq(
                        faq.map((f, i) =>
                          i === index ? { ...f, pregunta: e.target.value } : f
                        )
                      )
                    }
                    placeholder="Pregunta"
                    className={inputClass}
                  />
                  <textarea
                    value={item.respuesta}
                    onChange={(e) =>
                      updateFaq(
                        faq.map((f, i) =>
                          i === index ? { ...f, respuesta: e.target.value } : f
                        )
                      )
                    }
                    rows={2}
                    placeholder="Respuesta"
                    className={textareaClass}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateFaq([...faq, { pregunta: "", respuesta: "" }])}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#1F2937] hover:bg-[#FAFAFA] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar pregunta
              </button>
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <Section
            title="Organización"
            description="Datos estructurados de la empresa"
          >
            <TextField
              label="Nombre"
              value={settings.orgNombre || ""}
              onChange={(v) => handleChange("orgNombre", v)}
              placeholder="Wolfie Room"
            />
            <TextField
              label="Logo (URL)"
              value={settings.orgLogo || ""}
              onChange={(v) => handleChange("orgLogo", v)}
              placeholder="https://.../logo.png"
            />
            <TextField
              label="Dirección"
              value={settings.orgDireccion || ""}
              onChange={(v) => handleChange("orgDireccion", v)}
            />
            <TextField
              label="Ciudad"
              value={settings.orgCiudad || ""}
              onChange={(v) => handleChange("orgCiudad", v)}
            />
            <TextField
              label="Provincia"
              value={settings.orgProvincia || ""}
              onChange={(v) => handleChange("orgProvincia", v)}
            />
            <TextField
              label="País"
              value={settings.orgPais || ""}
              onChange={(v) => handleChange("orgPais", v)}
            />
            <TextField
              label="Código postal"
              value={settings.orgCodigoPostal || ""}
              onChange={(v) => handleChange("orgCodigoPostal", v)}
            />
            <TextField
              label="Teléfono"
              value={settings.orgTelefono || ""}
              onChange={(v) => handleChange("orgTelefono", v)}
            />
            <TextField
              label="Email"
              type="email"
              value={settings.orgEmail || ""}
              onChange={(v) => handleChange("orgEmail", v)}
            />
          </Section>

          <Section
            title="Verificación"
            description="Códigos de verificación de los buscadores"
          >
            <TextField
              label="Google (google-site-verification)"
              value={settings.googleVerification || ""}
              onChange={(v) => handleChange("googleVerification", v)}
              hint="El código del meta tag de Google Search Console."
            />
            <TextField
              label="Bing (msvalidate.01)"
              value={settings.bingVerification || ""}
              onChange={(v) => handleChange("bingVerification", v)}
              hint="El código del meta tag de Bing Webmaster Tools."
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
