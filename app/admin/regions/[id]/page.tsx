import { getRegionById, listOrganizations, getBaseLayersByRegion } from "@/lib/service/adminService";
import { RegionSimpleEdit } from "@/components/admin/region-simple-edit";
import { RegionMapPreview } from "@/components/admin/region-map-preview";
import { notFound } from "next/navigation";

export default async function RegionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const regionId = parseInt(id, 10);
  if (isNaN(regionId)) return notFound();

  const [region, organizations, baseLayers] = await Promise.all([
    getRegionById(regionId),
    listOrganizations(),
    getBaseLayersByRegion(regionId),
  ]);

  if (!region) return notFound();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Editar Região: {region.nome}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2">
            Edição rápida das propriedades da região selecionada.
          </p>
        </header>

        <RegionSimpleEdit 
          region={{
            id: region.id,
            nome: region.nome,
            organizationId: region.organizationId,
          }}
          organizations={organizations}
        />

        <div className="pt-8">
          <RegionMapPreview
            regionId={region.id}
            initialGeoJson={region.geojson || null}
            baseLayers={baseLayers}
          />
        </div>
      </div>
    </div>
  );
}
