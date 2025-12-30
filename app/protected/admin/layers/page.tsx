import { findAllLayersCatalog } from "@/lib/repositories/layerRepository";
import { LayerCatalogViewer } from "@/components/admin/layer-catalog-viewer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Layers | Sala de Situação",
  description: "Gerenciamento de camadas do mapa",
};

export default async function AdminLayersPage() {
  const layers = await findAllLayersCatalog();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Catálogo de Camadas</h2>
        <div className="flex items-center space-x-2">
          {/* Future: Add 'New Layer' button here */}
        </div>
      </div>
      
      <LayerCatalogViewer layers={layers as any[]} />
    </div>
  );
}
