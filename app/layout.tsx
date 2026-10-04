import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

import "leaflet/dist/leaflet.css"; // Leaflet Styles Global
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

// Interface em Plex Sans; números, coordenadas e dados técnicos em Plex Mono (DESIGN.md 5)
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "GEO PRISMA",
  description: "Centro de Comando Ambiental para gestão estratégica e antecipação de crises.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${plex.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body className="bg-background font-sans antialiased">
          <main className="">
              <div className="">
                {children}
                <Toaster />
              </div>
          </main>
      </body>
    </html>
  );
}
