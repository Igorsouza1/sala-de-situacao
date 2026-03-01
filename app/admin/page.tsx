import { fetchAdminDashboardData } from "@/lib/service/organizationService";
import { Building2, MapPin, AlignLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const data = await fetchAdminDashboardData();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Painel do Super Administrador
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2">
            Visão geral de todas as Organizações e Regiões cadastradas no sistema.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="/admin/organizations" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Gerir Organizações
            </a>
            <a href="/admin/regions" className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
              Gerir Regiões
            </a>
          </div>
        </header>

        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <Building2 className="h-10 w-10 text-neutral-400 mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400 font-medium">Nenhum dado encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((item, index) => (
              <div 
                key={`${item.organizationId}-${item.regionId}-${index}`}
                className="group flex flex-col bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                
                <div className="p-5 flex-1 space-y-4">
                  
                  {/* Organization */}
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                        Organização
                      </h3>
                      <p className="font-medium text-neutral-900 dark:text-neutral-50 break-words">
                        {item.organizationName || "Sem Nome"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="h-px w-full bg-neutral-100 dark:bg-neutral-800" />
                  
                  {/* Region */}
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg shrink-0">
                      <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                        Região
                      </h3>
                      <p className="font-medium text-neutral-900 dark:text-neutral-50 break-words">
                        {item.regionName || "Sem Região"}
                      </p>
                    </div>
                  </div>

                  {/* Description Element - if present */}
                  {item.regionDescription && (
                    <div className="flex items-start space-x-3 pt-2">
                       <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg shrink-0 hidden md:block">
                          <AlignLeft className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                      <div className="flex-1">
                         <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 mb-1 md:hidden">
                          Descrição
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                          {item.regionDescription}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
