import { Navbar } from "@/components/Navbar";
import "@/app/globals.css";
import { MapProvider } from "@/context/GeoDataContext";
import { AcoesProvider } from "@/context/AcoesContext";
import { DequePedrasProvider } from "@/context/DequePedrasContext";
import { RegionProvider } from "@/context/RegionContext";

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
    <RegionProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Navbar />
        <MapProvider>
          <AcoesProvider>
            <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
          </AcoesProvider>
        </MapProvider>
      </div>
    </RegionProvider>
  );
}
