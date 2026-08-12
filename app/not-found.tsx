import Link from "next/link";
import type { Metadata } from "next";
import { getSeoSettings } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  const settings = await getSeoSettings();
  const siteName = settings.nombreSitio;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-6xl font-bold text-primary">404</p>
        <h1 className="mt-4 text-2xl font-bold text-text sm:text-3xl">
          Esta página no existe
        </h1>
        <p className="mt-3 text-text-secondary">
          Parece que el enlace que seguiste no es válido o la página fue movida.
          Volvé al catálogo para seguir explorando {siteName}.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
