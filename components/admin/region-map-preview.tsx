"use client";

import { useEffect, useState, useRef } from "react";
import { FeatureCollection, Feature, Geometry } from "geojson";
import { GeoJsonUploader } from "./geojson-uploader";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Save, Layers, Maximize } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useRouter } from "next/navigation";
import { BaseLayersManager, BaseLayerDto } from "./base-layers-manager";
import Map, { Source, Layer, MapRef } from "react-map-gl/maplibre";
import bbox from "@turf/bbox";
import "maplibre-gl/dist/maplibre-gl.css";

interface RegionMapPreviewProps {
  regionId: number;
  initialGeoJson: string | null;
  baseLayers?: BaseLayerDto[];
}

export function RegionMapPreview({ regionId, initialGeoJson, baseLayers = [] }: RegionMapPreviewProps) {
  const router = useRouter();
  const mapRef = useRef<MapRef | null>(null);

  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [originalGeoData, setOriginalGeoData] = useState<FeatureCollection | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Settings state
  const [expandBoundary, setExpandBoundary] = useState(false); // Make union optional by default so users don't accidentally check it without reading
  const [createBaseLayer, setCreateBaseLayer] = useState(true);
  const [isForUnion, setIsForUnion] = useState(false); // Controls preview intensity/type before upload
  const [layerName, setLayerName] = useState("");
  const [layerColor, setLayerColor] = useState("#000000");
  const [layerOpacity, setLayerOpacity] = useState([20]); // 0 to 100
  const [layerWeight, setLayerWeight] = useState([2]); // 1 to 10

  useEffect(() => {
    if (isPreviewing && geoData && mapRef.current && geoData.features?.length > 0) {
      try {
        const [minLng, minLat, maxLng, maxLat] = bbox(geoData);
        mapRef.current.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 50, duration: 1000 }
        );
      } catch (e) {
        console.error("Erro ao focar câmera na fronteira (bbox)", e);
      }
    }
  }, [isPreviewing, geoData]);

  useEffect(() => {
    if (initialGeoJson) {
      try {
        const parsed = JSON.parse(initialGeoJson);
        let collection: FeatureCollection | null = null;
        if (parsed.type === "FeatureCollection") {
          collection = parsed;
        } else if (parsed.type === "Feature") {
          collection = { type: "FeatureCollection", features: [parsed] };
        } else if (["Polygon", "MultiPolygon", "Point", "LineString", "MultiLineString"].includes(parsed.type)) {
          collection = {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: parsed,
                properties: {}
              }
            ]
          };
        }

        if (collection) {
          setGeoData(collection);
          setOriginalGeoData(collection);
        }
      } catch (e) {
        console.error("Failed to parse initial region geojson", e);
      }
    }
  }, [initialGeoJson]);

  const handleGeoJsonUpload = async (file: File) => {
    setIsLoading(true);
    setUploadedFile(file);
    setUploadProgress(0);

    try {
      let previewGeoData: FeatureCollection | null = null;
      let currentUploadId: string | null = null;
      let currentTotalChunks = 0;

      // Helper for chunked upload
      const uploadInChunks = async (fileToUpload: File) => {
         const CHUNK_SIZE = 3 * 1024 * 1024;
         const tChunks = Math.ceil(fileToUpload.size / CHUNK_SIZE);
         const generatedUploadId = crypto.randomUUID();
         
         for (let i = 0; i < tChunks; i++) {
            const chunk = fileToUpload.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            const chunkData = new FormData();
            chunkData.append("uploadId", generatedUploadId);
            chunkData.append("chunkIndex", i.toString());
            chunkData.append("chunk", chunk);

            const chunkRes = await fetch("/api/admin/regions/upload-chunk", {
               method: "POST",
               body: chunkData,
            });

            if (!chunkRes.ok) throw new Error("Falha ao enviar o fragmento " + i);
            setUploadProgress(Math.round(((i + 1) / tChunks) * 100));
         }
         return { id: generatedUploadId, count: tChunks };
      };

      const text = await file.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        throw new Error("O arquivo está corrompido, e não é um JSON válido. Redownload do site fonte pode resolver o erro Inesperado de Fim de Arquivo.");
      }

      if (parsed.type === "FeatureCollection") {
        previewGeoData = parsed;
      } else if (parsed.type === "Feature") {
        previewGeoData = { type: "FeatureCollection", features: [parsed] };
      } else if (parsed.type === "Point" || parsed.type === "Polygon" || parsed.type === "MultiPolygon" || parsed.type === "GeometryCollection") {
        previewGeoData = {
           type: "FeatureCollection",
           features: [{ type: "Feature", geometry: parsed, properties: {} }]
        };
      } else {
        throw new Error("Formato não suportado ou erro de parse no OpenBuilds geojson.");
      }

      if (isForUnion) {
        // Apenas pré-carregamos o upload para o Save() ser mais fluído, mas pulamos a API de Preview
        // porque MapLibre lida com 100.000 features facilmente usando a placa de vídeo.
        // Tentar unificar 100.000 polígonos no PostgreSQL travava o VectorTiles (Earcut triangulation).
        const { id, count } = await uploadInChunks(file);
        setUploadId(id);
        setTotalChunks(count);
        setUploadProgress(null);
      }

      setGeoData(previewGeoData);
      setPreviewUrl(URL.createObjectURL(file));
      setIsPreviewing(true);

      // Auto-generate a name for convenience
      setLayerName(`Nova Camada ${new Date().toLocaleDateString()}`);

    } catch (error) {
      console.error("Preview failed:", error);
      alert(error instanceof Error ? error.message : "Erro ao carregar o arquivo. O arquivo pode estar mal formatado.");
      setUploadedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPreview = () => {
    setGeoData(originalGeoData);
    setIsPreviewing(false);
    setUploadedFile(null);
    setUploadId(null);
    setTotalChunks(0);
    if (previewUrl) {
       URL.revokeObjectURL(previewUrl);
       setPreviewUrl(null);
    }
  };

  const handleSave = async () => {
    if (!uploadedFile) return;
    setIsSaving(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("expandBoundary", expandBoundary.toString());
      formData.append("createBaseLayer", createBaseLayer.toString());

      if (uploadId && totalChunks > 0) {
         setUploadProgress(null); // Wait on server
         formData.append("uploadId", uploadId);
         formData.append("totalChunks", totalChunks.toString());
      } else {
         const CHUNK_SIZE = 3 * 1024 * 1024;
         const tChunks = Math.ceil(uploadedFile.size / CHUNK_SIZE);
         const generatedUploadId = crypto.randomUUID();
         
         for (let i = 0; i < tChunks; i++) {
            const chunk = uploadedFile.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            const chunkData = new FormData();
            chunkData.append("uploadId", generatedUploadId);
            chunkData.append("chunkIndex", i.toString());
            chunkData.append("chunk", chunk);
            await fetch("/api/admin/regions/upload-chunk", { method: "POST", body: chunkData });
            setUploadProgress(Math.round(((i + 1) / tChunks) * 100));
         }

         formData.append("uploadId", generatedUploadId);
         formData.append("totalChunks", tChunks.toString());
      }

      if (createBaseLayer) {
        formData.append("layerConfig", JSON.stringify({
          name: layerName || `Camada Base ${Math.floor(Math.random() * 1000)}`,
          color: layerColor,
          fillOpacity: layerOpacity[0] / 100,
          weight: layerWeight[0]
        }));
      }

      const response = await fetch(`/api/admin/regions/${regionId}/commit-union`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to commit union.");
      }

      // Success, reset preview state and refresh page to show new initial geometry and layer list
      setIsPreviewing(false);
      setUploadedFile(null);
      setUploadId(null);
      setTotalChunks(0);
      if (previewUrl) {
         URL.revokeObjectURL(previewUrl);
         setPreviewUrl(null);
      }
      router.refresh();

    } catch (error) {
      console.error("Save failed:", error);
      alert(error instanceof Error ? error.message : "Erro ao salvar alterações");
    } finally {
      setIsSaving(false);
    }
  };

  const defaultCenter = { longitude: -46.6333, latitude: -23.5505, zoom: 9 };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
            Composição Geográfica
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Adicione novas áreas para unir e compor esta região.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end z-10">
          {isPreviewing ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancelPreview}
              disabled={isSaving}
              className="h-12 rounded-xl font-medium gap-2 px-6 shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Cancelar Preview
            </Button>
          ) : (
             <div className="flex flex-col gap-2 border p-3 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-for-union"
                    checked={isForUnion}
                    onCheckedChange={(c) => setIsForUnion(c === true)}
                  />
                  <Label htmlFor="is-for-union" className="text-xs font-medium leading-none cursor-pointer">
                    Usar este arquivo para Expandir Fronteira?
                  </Label>
                </div>
                <p className="text-[10px] text-neutral-500 max-w-[250px]">
                  {isForUnion ?
                    "O mapa tentará calcular o preview da União (mais lento em arquivos gigantes)." :
                    "Ideal para visualizar Camadas Base pesadas instantaneamente."}
                </p>
                <div className="pt-1 border-t dark:border-neutral-800">
                  <GeoJsonUploader
                    onUpload={handleGeoJsonUpload}
                    isUploading={isLoading}
                  />
                </div>
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Column */}
        <div className={`col-span-1 ${isPreviewing ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm relative z-0">

            {isLoading && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3 w-3/4 max-w-sm">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {uploadProgress !== null ? "Enviando e fatiando arquivo..." : "Processando união complexa..."}
                  </span>
                  {uploadProgress !== null && uploadProgress > 0 && (
                     <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mt-2">
                        <div 
                          className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                     </div>
                  )}
                </div>
              </div>
            )}

            {isSaving && uploadProgress !== null && uploadProgress > 0 && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3 w-3/4 max-w-sm">
                  <Save className="w-8 h-8 text-neutral-600 dark:text-neutral-400" />
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    Salvando dados (Fazendo upload: {uploadProgress}%)...
                  </span>
                  <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mt-2">
                     <div 
                       className="h-full bg-emerald-500 transition-all duration-300" 
                       style={{ width: `${uploadProgress}%` }}
                     />
                  </div>
                </div>
              </div>
            )}

            <Map
              ref={mapRef}
              id={`region-map-${regionId}`}
              initialViewState={defaultCenter}
              mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
              style={{ width: "100%", height: "100%" }}
            >
              {/* Render Base Layers First */}
              {baseLayers.map((layer) => {
                 if (!layer.geojson || layer.visualConfig?.defaultVisibility === false) return null;

                 let parsedLayerGeo = null;
                 try { parsedLayerGeo = typeof layer.geojson === 'string' ? JSON.parse(layer.geojson) : layer.geojson; } catch(e){}
                 if (!parsedLayerGeo) return null;

                 const styleConfig = layer.visualConfig?.baseStyle || {};
                 return (
                    <Source key={`source-base-layer-${layer.id}`} type="geojson" data={parsedLayerGeo}>
                      <Layer
                        id={`fill-base-layer-${layer.id}`}
                        type="fill"
                        paint={{
                          "fill-color": styleConfig.color || "#000000",
                          "fill-opacity": styleConfig.fillOpacity ?? 0.2
                        }}
                      />
                      <Layer
                        id={`line-base-layer-${layer.id}`}
                        type="line"
                        paint={{
                          "line-color": styleConfig.color || "#000000",
                          "line-width": styleConfig.weight || 2
                        }}
                      />
                    </Source>
                 );
              })}

              {/* Main Region Geometry */}
              {(previewUrl || geoData) && (
                <Source id="main-region-source" type="geojson" data={previewUrl || geoData || { type: "FeatureCollection", features: [] }}>
                  <Layer
                    id="main-region-fill"
                    type="fill"
                    paint={{
                      "fill-color": isPreviewing ? layerColor : "#10b981",
                      "fill-opacity": isPreviewing ? layerOpacity[0] / 100 : 0.2
                    }}
                  />
                  <Layer
                    id="main-region-line"
                    type="line"
                    paint={{
                      "line-color": isPreviewing ? layerColor : "#10b981",
                      "line-width": isPreviewing ? layerWeight[0] : 2
                    }}
                  />
                </Source>
              )}
            </Map>
          </div>

          {isPreviewing && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-200 text-sm flex justify-between items-center">
                <p><strong>Atenção:</strong> Você está visualizando um preview temporário. Preencha as configurações ao lado e salve para confirmar.</p>
            </div>
          )}
        </div>

        {/* Options Column */}
        {isPreviewing && (
          <div className="col-span-1 space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg border-b pb-4 dark:border-neutral-800">Finalizar Alterações</h3>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="expand-boundary"
                  checked={expandBoundary}
                  onCheckedChange={(c) => setExpandBoundary(c === true)}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="expand-boundary" className="text-sm font-medium flex items-center gap-2">
                    <Maximize className="w-4 h-4 text-emerald-500" />
                    Expandir Fronteira
                  </Label>
                  <p className="text-xs text-neutral-500">Unir a nova área com a geometria central da região.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="create-layer"
                  checked={createBaseLayer}
                  onCheckedChange={(c) => setCreateBaseLayer(c === true)}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="create-layer" className="text-sm font-medium flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" />
                    Criar Camada Base
                  </Label>
                  <p className="text-xs text-neutral-500">Adicionar a nova área ao catálogo de camadas territoriais.</p>
                </div>
              </div>
            </div>

            {createBaseLayer && (
              <div className="space-y-5 pt-4 border-t dark:border-neutral-800">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Nome da Nova Camada</Label>
                  <Input
                    value={layerName}
                    onChange={(e) => setLayerName(e.target.value)}
                    placeholder="Ex: Zona de Amortecimento"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex justify-between">
                    <span>Cor da Linha</span>
                    <span>{layerColor}</span>
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={layerColor}
                      onChange={(e) => setLayerColor(e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <div className="flex-1 space-y-2">
                       <Label className="text-xs text-neutral-500">Espessura ({layerWeight[0]}px)</Label>
                       <Slider
                         value={layerWeight}
                         onValueChange={setLayerWeight}
                         max={10}
                         min={1}
                         step={1}
                       />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold flex justify-between">
                    <span>Opacidade do Preenchimento</span>
                    <span>{layerOpacity[0]}%</span>
                  </Label>
                  <Slider
                    value={layerOpacity}
                    onValueChange={setLayerOpacity}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
            )}

            <div className="pt-6 mt-6 border-t dark:border-neutral-800">
               <Button
                  onClick={handleSave}
                  disabled={isSaving || (!expandBoundary && !createBaseLayer)}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {isSaving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>
                  )}
               </Button>
            </div>
          </div>
        )}
      </div>

      {!isPreviewing && (
         <div className="pt-6">
            <BaseLayersManager
              regionId={regionId}
              layers={baseLayers}
              onLayerUpdate={() => router.refresh()}
            />
         </div>
      )}
    </div>
  );
}
