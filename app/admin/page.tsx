import { fetchAdminDashboardData } from "@/lib/service/organizationService";
import { Building2, MapPin, AlignLeft, Edit, Map } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

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
              <Card 
                key={`${item.organizationId}-${item.regionId}-${index}`}
                className="group relative flex flex-col bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Simulated Map Header */}
                <div className="relative w-full h-48 bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                   <Image 
                      src="/MAPA-PRISMA.JPG" // Utilizando o placeholder de mapa existente no site
                      alt={`Mapa da Região ${item.regionName}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent" />
                   
                   {/* Badge flutuante sobre o mapa */}
                   <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm px-3 py-1.5 rounded-md flex items-center gap-2 shadow-sm border border-black/5 dark:border-white/10">
                     <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                     <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 max-w-[200px] truncate">
                        {item.regionName || "Sem Região"}
                     </span>
                   </div>
                </div>

                <CardContent className="p-5 flex-1 space-y-3">
                  {/* Organization Info Compacto */}
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 shrink-0">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {item.organizationName || "Sem Nome"}
                      </p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                         Organização Responsável
                      </p>
                    </div>
                  </div>

                  {/* Description Compacto */}
                  {item.regionDescription && (
                    <div className="pt-2">
                       <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                          {item.regionDescription}
                       </p>
                    </div>
                  )}

                </CardContent>
                
                <CardFooter className="p-5 pt-0 mt-auto flex items-center justify-between gap-2 border-t border-neutral-100 dark:border-neutral-800/50 mt-4">
                 
                  <div className="flex items-center gap-2">
                     <Link href={`/admin/regions/${item.regionId}`} passHref>
                        <Button variant="outline" size="sm" className="h-8 px-3 rounded-md border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-all font-medium gap-1.5 text-xs">
                           <Edit className="h-3.5 w-3.5" />
                           Editar
                        </Button>
                     </Link>
                     <Link href={`/?region=${item.regionId}`} passHref>
                        <Button size="sm" className="h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all font-medium gap-1.5 text-xs">
                           <Map className="h-3.5 w-3.5" />
                           Acessar
                        </Button>
                     </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
