import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToasterProvider from "@/components/ToasterProvider";
import ProgressBar from "@/components/ProgressBar";
import Analytics from "@/components/Analytics";
import MarketingScripts from "@/components/MarketingScripts";
import { ProgressProvider } from "@/lib/progress-context";
import { AdaptiveProvider } from "@/lib/adaptive-context";
import { getSeoSettings, buildSiteMetadata } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();
  return buildSiteMetadata(settings);
}

export const viewport: Viewport = {
  themeColor: "#31D3A9",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSeoSettings();
  const lang = settings.idioma.split("_")[0] || "es";

  return (
    <html lang={lang} className={`${geistSans.variable} ${geistMono.variable}`}>
      <head />
      <body className="min-h-screen antialiased">
        <AdaptiveProvider>
          <ProgressProvider>
            <ProgressBar />
            {children}
          </ProgressProvider>
        </AdaptiveProvider>
        <ToasterProvider />
        <Analytics />
        <MarketingScripts />
      </body>
    </html>
  );
}
