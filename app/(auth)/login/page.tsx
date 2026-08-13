"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import ImageWithProgress from "@/components/ImageWithProgress";
import { sileo } from "sileo";
import { loginAction } from "@/actions/auth";
import { getPublicBrand } from "@/actions/settings";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(loginAction, null);
  const [brand, setBrand] = useState<{ nombreNegocio: string; logoUrl: string | null }>({
    nombreNegocio: "Catalogo App",
    logoUrl: null,
  });

  useEffect(() => {
    getPublicBrand().then(setBrand).catch(() => {});
  }, []);

  useEffect(() => {
    if (state?.error) {
      sileo.error({ title: "Error", description: state.error });
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#31D3A9]">
              {brand.logoUrl ? (
                <ImageWithProgress
                  src={brand.logoUrl}
                  alt={brand.nombreNegocio}
                  width={2252}
                  height={1373}
                  sizes="64px"
                  className="h-full w-full"
                  imgClassName="object-contain p-1.5"
                />
              ) : (
                <span className="text-[#0B3B30] font-bold text-2xl">
                  {brand.nombreNegocio.charAt(0) || "W"}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-[#1F2937]">Admin Panel</h1>
            <p className="text-[#6B7280] text-sm mt-1">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#1F2937] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all text-sm"
                placeholder="admin@catalogoapp.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#1F2937] mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#1F2937] placeholder-[#6B7280]/50 focus:outline-none focus:ring-2 focus:ring-[#31D3A9]/30 focus:border-[#31D3A9] transition-all text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 rounded-xl bg-[#31D3A9] text-[#0B3B30] font-medium text-sm hover:bg-[#2bc49b] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#6B7280] text-xs mt-6">
          {brand.nombreNegocio} &copy; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
