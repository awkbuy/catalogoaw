import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ToasterProvider from "@/components/ToasterProvider";
import ProgressBar from "@/components/ProgressBar";
import Analytics from "@/components/Analytics";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
