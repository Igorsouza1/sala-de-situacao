import { getRegionById, listOrganizations, getBaseLayersByRegion, getPropertiesByRegion, getFocosByRegion, getDesmatamentoByRegion, listRegions, getAcoesByRegion } from "@/lib/service/adminService";
import { RegionSimpleEdit } from "@/components/admin/region-simple-edit";
import { RegionMapPreview } from "@/components/admin/region-map-preview";
import { RegionGeoToolkit } from "@/components/admin/region-geo-toolkit";
import { AcoesManager } from "@/components/admin/acoes-manager";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RegionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const regionId = parseInt(id, 10);
  if (isNaN(regionId)) return notFound();

  const [region, organizations, baseLayers, properties, focos, desmatamento, regioes, acoes] = await Promise.all([
    getRegionById(regionId),
    listOrganizations(),
    getBaseLayersByRegion(regionId),
    getPropertiesByRegion(regionId),
    getFocosByRegion(regionId),
    getDesmatamentoByRegion(regionId),
    listRegions(),
    getAcoesByRegion(regionId),
  ]);

  if (!region) return notFound();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto max-w-7xl px-6 pb-24">

        <header className="pt-16 pb-10">
          <Link href="/admin/regions" className="text-[14px] text-[#0066cc]">
            &larr; Regiões
          </Link>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#1d1d1f]">
            {region.nome}
          </h1>
          <p className="mt-2 text-[17px] leading-[1.47] text-[#6e6e73]">
            {region.organizationName ?? "Sem organização"}
            {region.sizeKm2 > 0 && (
              <> · {Math.round(region.sizeKm2).toLocaleString("pt-BR")} km²</>
            )}
          </p>
        </header>

        {/* ── Ferramentas geoespaciais ── */}
        <section className="space-y-3">
          <div>
            <h2 className="text-[21px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">
              Área de influência
            </h2>
            <p className="mt-1 text-[14px] text-[#7a7a7a]">
              Expanda, contraia, mova, redesenhe ou refine o polígono da região.
            </p>
          </div>
          <RegionGeoToolkit
            regionId={region.id}
            nome={region.nome}
            descricao={region.descricao ?? null}
            organizationId={region.organizationId}
            initialGeoJson={region.geojson || null}
          />
        </section>

        {/* ── Propriedades básicas ── */}
        <section className="mt-12 space-y-3">
          <h2 className="text-[21px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">
            Propriedades
          </h2>
          <RegionSimpleEdit
            region={{
              id: region.id,
              nome: region.nome,
              organizationId: region.organizationId,
            }}
            organizations={organizations}
          />
        </section>

        {/* ── Camadas e dados vinculados ── */}
        <section className="mt-12">
          <h2 className="text-[21px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">
            Camadas e dados
          </h2>
          <RegionMapPreview
            regionId={region.id}
            initialGeoJson={region.geojson || null}
            baseLayers={baseLayers}
            properties={properties}
            focos={focos}
            desmatamento={desmatamento}
            regioes={regioes.map(r => ({ id: r.id, nome: r.nome }))}
          />
        </section>

        {/* ── Ações registradas ── */}
        <section className="mt-12">
          <AcoesManager
            key={`acoes-${region.id}`}
            regionId={region.id}
            acoes={acoes}
          />
        </section>

      </div>
    </div>
  );
}
