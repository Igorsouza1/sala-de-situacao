import "@/app/globals.css";
import { MapProvider } from "@/context/GeoDataContext";
import { AcoesProvider } from "@/context/AcoesContext";
import { RegionProvider } from "@/context/RegionContext";

export const metadata = {
  title: "Instituto Homem Pantaneiro",
  description: "Plataforma de gestão do Instituto Homem Pantaneiro",
};

export const dynamic = 'force-dynamic'

// O mapa é a tela: sem barra lateral. Navegação, dados e conta vivem dentro do mapa (dock, painel Situação e avatar).
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RegionProvider>
      <div className="h-screen overflow-hidden bg-background">
        <MapProvider>
          <AcoesProvider>
            <main className="h-full min-w-0 overflow-hidden">{children}</main>
          </AcoesProvider>
        </MapProvider>
      </div>
    </RegionProvider>
  );
}
