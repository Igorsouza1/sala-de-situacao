import { getRegionById } from "@/lib/service/adminService";
import { notFound } from "next/navigation";
import { RegionExpandPreview } from "@/components/admin/region-expand-preview";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function RegionExpandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const regionId = parseInt(id, 10);
  if (isNaN(regionId)) return notFound();

  const region = await getRegionById(regionId);
  if (!region) return notFound();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
             <Link href={`/admin/regions/${regionId}`}>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                   <ArrowLeft className="h-4 w-4" />
                </Button>
             </Link>
             <div>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  Expandir Fronteira: {region.nome}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                  Faça o upload de um GeoJSON para adicionar novas áreas à região principal.
                </p>
             </div>
          </div>
        </header>

        <RegionExpandPreview
          regionId={region.id}
          initialGeoJson={region.geojson || null}
        />
      </div>
    </div>
  );
}
