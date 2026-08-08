"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Upload, X, Check } from "lucide-react";
import ImageWithProgress from "@/components/ImageWithProgress";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import { uploadImage } from "@/lib/upload-image";
import { useProgress } from "@/lib/progress-context";
import ConfiguredBadge from "@/components/admin/ConfiguredBadge";

interface Settings {
  [key: string]: string;
}

function ToggleButtons({
  value,
  onTrue,
  onFalse,
  trueLabel = "Sí",
  falseLabel = "No",
}: {
  value: string;
  onTrue: () => void;
  onFalse: () => void;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return (
    <div className="flex rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-1 gap-1 max-w-[240px]">
      <button
        type="button"
        onClick={onTrue}
        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
          value !== "false"
            ? "bg-[#31D3A9] text-[#0B3B30]"
            : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
        }`}
      >
        {trueLabel}
      </button>
      <button
        type="button"
        onClick={onFalse}
        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
          value === "false"
            ? "bg-[#31D3A9] text-[#0B3B30]"
            : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
        }`}
      >
        {falseLabel}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { start, done } = useProgress();
  const [settings, setSettings] = useState<Settings>({});
  const [metaTokenConfigured, setMetaTokenConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        const { metaAccessTokenConfigured, ...rest } = data;
        setMetaTokenConfigured(metaAccessTokenConfigured === "true");
        setSettings(rest);
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    start();
    try {
      const result = await uploadImage(file);
      if ("url" in result) {
        setSettings((prev) => ({ ...prev, logoUrl: result.url }));
      } else {
        sileo.error({
          title: "Error al subir el logo",
          description: result.error,
        });
      }
    } finally {
      setUploadingLogo(false);
      done();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    start();
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        sileo.success({ title: "Configuración guardada correctamente" });
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        sileo.error({
          title: "Error al guardar",
          description: data?.error || "Ocurrió un error al guardar la configuración.",
        });
      }
    } catch {
      sileo.error({ title: "Error al guardar" });
    } finally {
      setSaving(false);
      done();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#31D3A9]" />
      </div>
    );
  }

  const settingFields = [
    { key: "nombre", label: "Nombre del sitio", type: "text" },
    { key: "descripcion", label: "Descripción", type: "textarea" },
    { key: "telefono", label: "Teléfono", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "direccion", label: "Dirección", type: "text" },
    { key: "horario", label: "Horario", type: "text" },
    { key: "instagram", label: "Instagram URL", type: "text" },
    { key: "facebook", label: "Facebook URL", type: "text" },
    { key: "whatsapp", label: "WhatsApp número", type: "text" },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Configuración</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Administra la información del sitio
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#31D3A9] text-[#0B3B30] text-sm font-medium hover:bg-[#2bc49b] disabled:opacity-60 transition-all"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : null}
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-4">
              Información general
            </h3>
            <div className="space-y-4">
              {settingFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={settings[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all resize-none"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={settings[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-4">
              Impuestos
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    IVA (%)
                  </label>
                  <input
                    type="number"
                    value={settings.iva || "21"}
                    onChange={(e) => handleChange("iva", e.target.value)}
                    min={0}
                    step="0.01"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                    placeholder="21"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Otros impuestos nacionales (%)
                  </label>
                  <input
                    type="number"
                    value={settings.otrosImpuestosNacionales || "0"}
                    onChange={(e) => handleChange("otrosImpuestosNacionales", e.target.value)}
                    min={0}
                    step="0.01"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Activar cálculo automático
                </label>
                <div className="flex rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-1 gap-1 max-w-[240px]">
                  <button
                    type="button"
                    onClick={() => handleChange("activoCalculoAutomatico", "true")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.activoCalculoAutomatico !== "false"
                        ? "bg-[#31D3A9] text-[#0B3B30]"
                        : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("activoCalculoAutomatico", "false")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.activoCalculoAutomatico === "false"
                        ? "bg-[#31D3A9] text-[#0B3B30]"
                        : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                  Mostrar precio sin impuestos nacionales
                </label>
                <div className="flex rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-1 gap-1 max-w-[240px]">
                  <button
                    type="button"
                    onClick={() => handleChange("mostrarPrecioSinImpuestos", "true")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.mostrarPrecioSinImpuestos !== "false"
                        ? "bg-[#31D3A9] text-[#0B3B30]"
                        : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("mostrarPrecioSinImpuestos", "false")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.mostrarPrecioSinImpuestos === "false"
                        ? "bg-[#31D3A9] text-[#0B3B30]"
                        : "text-[#6B7280] hover:bg-[#E5E7EB]/50"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-1">
              Google Analytics (GA4)
            </h3>
            <p className="text-[11px] text-[#9CA3AF] mb-4">
              Mide visitas, búsquedas y conversiones con Google Analytics 4.
            </p>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[#1F2937] mb-1.5">
                  Activar GA4
                  {settings.ga4Enabled !== "false" ? <ConfiguredBadge /> : null}
                </label>
                <ToggleButtons
                  value={settings.ga4Enabled || "true"}
                  onTrue={() => handleChange("ga4Enabled", "true")}
                  onFalse={() => handleChange("ga4Enabled", "false")}
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[#1F2937] mb-1.5">
                  Measurement ID
                  {settings.ga4MeasurementId ? <ConfiguredBadge /> : null}
                </label>
                <input
                  type="text"
                  value={settings.ga4MeasurementId || ""}
                  onChange={(e) => handleChange("ga4MeasurementId", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[#1F2937] mb-1.5">
                  Property ID
                  {settings.ga4PropertyId ? <ConfiguredBadge /> : null}
                </label>
                <input
                  type="text"
                  value={settings.ga4PropertyId || ""}
                  onChange={(e) => handleChange("ga4PropertyId", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="Ej. 548805609"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[#1F2937] mb-1.5">
                  Service Account Email (sync futuro)
                  {settings.ga4ServiceAccountEmail ? <ConfiguredBadge /> : null}
                </label>
                <input
                  type="email"
                  value={settings.ga4ServiceAccountEmail || ""}
                  onChange={(e) => handleChange("ga4ServiceAccountEmail", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="service@proyecto.iam.gserviceaccount.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-1">
              Meta Pixel + Conversions API
            </h3>
            <p className="text-[11px] text-[#9CA3AF] mb-4">
              Rastrea eventos con el Pixel de Meta y envía conversiones server-side (CAPI).
            </p>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[#1F2937] mb-1.5">
                  Activar Meta Pixel
                  {settings.metaPixelEnabled === "true" ? <ConfiguredBadge /> : null}
                </label>
                <ToggleButtons
                  value={settings.metaPixelEnabled || "false"}
                  onTrue={() => handleChange("metaPixelEnabled", "true")}
                  onFalse={() => handleChange("metaPixelEnabled", "false")}
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[#1F2937] mb-1.5">
                  Pixel ID
                  {settings.metaPixelId ? <ConfiguredBadge /> : null}
                </label>
                <input
                  type="text"
                  value={settings.metaPixelId || ""}
                  onChange={(e) => handleChange("metaPixelId", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="Ej. 123456789012345"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[#1F2937] mb-1.5">
                  Activar Conversions API
                  {settings.metaCapiEnabled === "true" ? <ConfiguredBadge /> : null}
                </label>
                <ToggleButtons
                  value={settings.metaCapiEnabled || "false"}
                  onTrue={() => handleChange("metaCapiEnabled", "true")}
                  onFalse={() => handleChange("metaCapiEnabled", "false")}
                />
                <p className="text-xs text-[#9CA3AF] mt-1.5 flex flex-wrap items-center gap-1.5">
                  El token de acceso se configura con la variable de entorno
                  <code className="px-1 py-0.5 bg-[#F3F4F6] rounded text-[11px]">
                    META_ACCESS_TOKEN
                  </code>
                  en el servidor (no se guarda en la base de datos).
                  {metaTokenConfigured ? <ConfiguredBadge label="Token presente" /> : null}
                </p>
              </div>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[#1F2937] mb-1.5">
                  Test Event Code (opcional)
                  {settings.metaTestEventCode ? <ConfiguredBadge /> : null}
                </label>
                <input
                  type="text"
                  value={settings.metaTestEventCode || ""}
                  onChange={(e) => handleChange("metaTestEventCode", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="TESTXXXXXX"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[#1F2937] mb-1.5">
                  Business Manager ID
                  {settings.metaBusinessId ? <ConfiguredBadge /> : null}
                </label>
                <input
                  type="text"
                  value={settings.metaBusinessId || ""}
                  onChange={(e) => handleChange("metaBusinessId", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="Ej. 123456789"
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[#1F2937] mb-1.5">
                  Catalog ID (Catálogo Commerce)
                  {settings.metaCatalogId ? <ConfiguredBadge /> : null}
                </label>
                <input
                  type="text"
                  value={settings.metaCatalogId || ""}
                  onChange={(e) => handleChange("metaCatalogId", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="Ej. 987654321"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-1">
              Microsoft Clarity
            </h3>
            <p className="text-[11px] text-[#9CA3AF] mb-4">
              Grabaciones de sesión y mapas de calor de Microsoft.
            </p>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[#1F2937] mb-1.5">
                  Activar Clarity
                  {settings.clarityEnabled === "true" ? <ConfiguredBadge /> : null}
                </label>
                <ToggleButtons
                  value={settings.clarityEnabled || "false"}
                  onTrue={() => handleChange("clarityEnabled", "true")}
                  onFalse={() => handleChange("clarityEnabled", "false")}
                />
              </div>
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-[#1F2937] mb-1.5">
                  Project ID
                  {settings.clarityProjectId ? <ConfiguredBadge /> : null}
                </label>
                <input
                  type="text"
                  value={settings.clarityProjectId || ""}
                  onChange={(e) => handleChange("clarityProjectId", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] text-sm focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all"
                  placeholder="Ej. abcdefghij"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-4">Logo</h3>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />

            {settings.logoUrl ? (
              <div className="relative">
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#E5E7EB] flex items-center justify-center p-4">
                  <ImageWithProgress
                    src={settings.logoUrl}
                    alt="Logo"
                    width={2252}
                    height={1373}
                    imgClassName="max-w-full max-h-full w-auto h-auto object-contain"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex-1 py-2 rounded-xl border border-[#E5E7EB] text-xs font-medium text-[#1F2937] hover:bg-[#FAFAFA] transition-colors flex items-center justify-center gap-1.5"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    Cambiar
                  </button>
                  <button
                    onClick={() => handleChange("logoUrl", "")}
                    className="py-2 px-3 rounded-xl border border-[#E5E7EB] text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="w-full aspect-square rounded-xl border-2 border-dashed border-[#E5E7EB] hover:border-[#31D3A9]/50 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#31D3A9]" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-[#6B7280]" />
                    <span className="text-xs text-[#6B7280]">Subir logo</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
