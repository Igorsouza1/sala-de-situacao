import { fetchAdminDashboardData } from "@/lib/service/organizationService";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { RegionShape } from "@/components/admin/region-shape";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const data = await fetchAdminDashboardData();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto max-w-[1024px] px-6">

        <header className="pt-20 pb-14 text-center">
          <h1 className="text-[40px] md:text-[48px] font-semibold leading-[1.07] tracking-[-0.02em] text-[#1d1d1f]">
            Sala de Situação
          </h1>
          <p className="mt-3 text-[19px] md:text-[21px] font-normal leading-[1.4] text-[#6e6e73]">
            Administração de organizações e regiões monitoradas.
          </p>
          <div className="mt-7 flex items-center justify-center gap-4">
            <Link
              href="/admin/organizations"
              className="rounded-full bg-[#0066cc] px-[22px] py-[11px] text-[15px] font-normal text-white transition-transform active:scale-95"
            >
              Gerir Organizações
            </Link>
            <Link
              href="/admin/regions"
              className="rounded-full border border-[#0066cc] px-[22px] py-[11px] text-[15px] font-normal text-[#0066cc] transition-transform active:scale-95"
            >
              Gerir Regiões
            </Link>
          </div>
        </header>

        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[18px] border border-[#e0e0e0] bg-white py-24">
            <Building2 className="mb-4 h-8 w-8 text-[#7a7a7a]" strokeWidth={1.5} />
            <p className="text-[17px] text-[#1d1d1f]">Nenhuma região cadastrada.</p>
            <p className="mt-1 text-[14px] text-[#7a7a7a]">
              Crie uma organização e vincule a primeira região para começar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 pb-24 md:grid-cols-2 lg:grid-cols-3">
            {data.map((item, index) => (
              <div
                key={`${item.organizationId}-${item.regionId}-${index}`}
                className="flex flex-col overflow-hidden rounded-[18px] border border-[#e0e0e0] bg-white"
              >
                {/* Silhueta real da área */}
                <div className="flex h-44 items-center justify-center bg-[#f5f5f7]">
                  {item.regionGeojson ? (
                    <RegionShape
                      geojson={item.regionGeojson}
                      className="h-32 w-32 text-[#1d1d1f]/80"
                    />
                  ) : (
                    <span className="text-[12px] text-[#7a7a7a]">Sem geometria</span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-[17px] font-semibold leading-tight tracking-[-0.01em] text-[#1d1d1f]">
                    {item.regionName || "Sem nome"}
                  </h2>
                  <p className="mt-1 text-[14px] text-[#7a7a7a]">
                    {item.organizationName || "Sem organização"}
                    {item.sizeKm2 > 0 && (
                      <> · {Math.round(item.sizeKm2).toLocaleString("pt-BR")} km²</>
                    )}
                  </p>

                  {item.regionDescription && (
                    <p className="mt-3 line-clamp-2 text-[14px] leading-[1.45] text-[#424245]">
                      {item.regionDescription}
                    </p>
                  )}

                  <div className="mt-auto flex items-center gap-4 pt-5">
                    <Link
                      href={`/protected?regiao_id=${item.regionId}`}
                      className="rounded-full bg-[#0066cc] px-[18px] py-[8px] text-[14px] text-white transition-transform active:scale-95"
                    >
                      Acessar
                    </Link>
                    <Link
                      href={`/admin/regions/${item.regionId}`}
                      className="text-[14px] text-[#0066cc]"
                    >
                      Editar região
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
