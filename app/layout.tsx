
import { Noto_Sans } from "next/font/google";


// import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "PRISMA AMBIENTAL",
  description: "Sala de situação para monitormaneto ambiental",
};

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans", // Variável CSS para o Tailwind
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={notoSans.className} suppressHydrationWarning>
      <body className="bg-background">
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
