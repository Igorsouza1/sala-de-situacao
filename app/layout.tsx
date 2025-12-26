import { Noto_Sans } from "next/font/google";
import { Inter, JetBrains_Mono } from "next/font/google"; // This line was missing and is now added.

// import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next"; // This line was missing and is now added.

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "PRISMA - Sala de Situação",
  description: "Centro de Comando Ambiental para gestão estratégica e antecipação de crises.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="bg-background font-sans antialiased">
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        > */}
          <main className="">
              <div className="">
                {children}
                <Toaster />
              </div>
          </main>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
