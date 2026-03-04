"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Map, ArrowLeft, Save, Building2, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveRegionMetadata } from "@/app/admin/regions/[id]/actions";

export function RegionSimpleEdit({ 
  region, 
  organizations 
}: { 
  region: { id: number; nome: string; organizationId: string | null },
  organizations: { id: string; name: string }[]
}) {
  const [nome, setNome] = useState(region.nome);
  const [organizationId, setOrganizationId] = useState(region.organizationId || "");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    await saveRegionMetadata(region.id, { nome, organizationId });
    setIsSaving(false);
    router.push("/admin");
    router.refresh();
  };

  return (
    <Card className="rounded-[24px] overflow-hidden shadow-sm border-neutral-200 dark:border-white/10 dark:bg-neutral-900/40 backdrop-blur-xl">
      <CardContent className="p-8 space-y-8">
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-500" /> Nome da Região
          </Label>
          <Input 
            value={nome} 
            onChange={e => setNome(e.target.value)} 
            className="h-12 rounded-xl border-neutral-200 dark:border-neutral-800 focus:bg-white dark:focus:bg-neutral-950 transition-colors"
            placeholder="Ex: Bacia do Rio Formoso"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" /> Organização Responsável
          </Label>
          <Select value={organizationId} onValueChange={setOrganizationId}>
            <SelectTrigger className="h-12 rounded-xl border-neutral-200 dark:border-neutral-800">
              <SelectValue placeholder="Selecione uma organização" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {organizations.map(org => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      <CardFooter className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 p-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex w-full md:w-auto gap-3">
          <Link href="/admin">
            <Button variant="outline" className="h-12 px-6 rounded-xl font-medium gap-2 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !nome || !organizationId} 
            className="h-12 px-8 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <Save className="h-4 w-4" /> {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
        
        <Link href={`/admin/regions/${region.id}/expand`} className="w-full md:w-auto">
          <Button variant="secondary" className="w-full h-12 px-6 rounded-xl font-medium gap-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-sm transition-all text-neutral-700 dark:text-neutral-300">
            <Map className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Expandir Fronteira
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
