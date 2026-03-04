"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Trash2, FileJson, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { uploadPropertiesAction, deletePropertyAction, fetchPropertiesAction } from "@/app/admin/regions/[id]/actions";
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: number;
  nome: string | null;
  cod_imovel: string | null;
  municipio: string | null;
  num_area: number | null;
}

export function PropertyManager({ regiaoId }: { regiaoId: number }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPropertiesAction(regiaoId);
      setProperties(data as any);
    } catch (error) {
      toast({
        title: "Erro ao carregar propriedades",
        description: "Não foi possível buscar as propriedades desta região.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [regiaoId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const geojson = JSON.parse(e.target?.result as string);
        const result = await uploadPropertiesAction(regiaoId, geojson);

        toast({
          title: "Upload concluído",
          description: `${result.insertedCount} inseridas, ${result.skippedCount} ignoradas (duplicatas ou inválidas).`,
        });

        loadProperties();
      } catch (error) {
        toast({
          title: "Erro no processamento",
          description: "O arquivo GeoJSON é inválido ou ocorreu um erro no servidor.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta propriedade?")) return;

    try {
      await deletePropertyAction(regiaoId, id);
      toast({
        title: "Propriedade removida",
        description: "A propriedade foi excluída com sucesso.",
      });
      loadProperties();
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível excluir a propriedade.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[24px] overflow-hidden shadow-sm border-neutral-200 dark:border-white/10 dark:bg-neutral-900/40 backdrop-blur-xl">
        <CardHeader className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileJson className="w-5 h-5 text-blue-500" /> Gerenciar Camada de Propriedades (CAR)
              </CardTitle>
              <CardDescription className="mt-1">
                Importe arquivos GeoJSON para adicionar propriedades à região. O sistema evita duplicatas automaticamente.
              </CardDescription>
            </div>
            <div className="relative">
              <Input
                type="file"
                accept=".geojson,application/json"
                onChange={handleFileUpload}
                className="hidden"
                id="geojson-upload"
                disabled={isUploading}
              />
              <Button asChild disabled={isUploading} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <label htmlFor="geojson-upload" className="cursor-pointer">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? "Processando..." : "Importar GeoJSON"}
                </label>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
              <p>Carregando propriedades...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-500">
              <AlertCircle className="w-10 h-10 mb-4 opacity-20" />
              <p>Nenhuma propriedade cadastrada nesta região.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-neutral-50 dark:bg-neutral-900/50">
                  <TableRow>
                    <TableHead className="font-semibold">Nome/Código</TableHead>
                    <TableHead className="font-semibold">Município</TableHead>
                    <TableHead className="font-semibold">Área (ha)</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((prop) => (
                    <TableRow key={prop.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{prop.nome || "Sem nome"}</span>
                          <span className="text-xs text-neutral-500 font-mono">{prop.cod_imovel}</span>
                        </div>
                      </TableCell>
                      <TableCell>{prop.municipio || "-"}</TableCell>
                      <TableCell>{prop.num_area?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(prop.id)}
                          className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
