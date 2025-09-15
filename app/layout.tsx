
import { Geist } from "next/font/google";
import { RegiaoProvider } from "@/context/RegiaoContext";
// import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "PRISMA AMBIENTAL",
  description: "Sala de situação para monitormaneto ambiental",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background">
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        > */}
        <RegiaoProvider>
          <main className="">
              <div className="">
                {children}
              </div>
          </main>
        </RegiaoProvider>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
