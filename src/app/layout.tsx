import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Racebook — Sua trajetória esportiva",
    template: "%s · Racebook",
  },
  description:
    "Crie seu portfólio esportivo: provas, resultados, pódios, equipamentos, treinos e fotos em um perfil público para compartilhar.",
  applicationName: "Racebook",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Racebook",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1528",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${barlow.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
