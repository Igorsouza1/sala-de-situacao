import { Navbar } from "@/components/Navbar";
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { MapProvider } from "@/context/GeoDataContext";
import { AcoesProvider } from "@/context/AcoesContext";
import { DequePedrasProvider } from "@/context/DequePedrasContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Instituto Homem Pantaneiro",
  description: "Plataforma de gestão do Instituto Homem Pantaneiro",
};

export const dynamic = 'force-dynamic'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Navbar />
      <MapProvider>
        <AcoesProvider>
          <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
        </AcoesProvider>
      </MapProvider>
    </div>
  );
}
