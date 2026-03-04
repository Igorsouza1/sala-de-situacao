"use client";

import { useEffect, useState, useRef } from "react";
import { FeatureCollection, Feature, Geometry } from "geojson";
import { GeoJsonUploader } from "./geojson-uploader";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Save, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useRouter } from "next/navigation";
import { BaseLayersManager, BaseLayerDto } from "./base-layers-manager";
import Map, { Source, Layer, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import bbox from "@turf/bbox";

interface RegionMapPreviewProps {
  regionId: number;
  initialGeoJson: string | null;
  baseLayers?: BaseLayerDto[];
}

export function RegionMapPreview({ regionId, initialGeoJson, baseLayers = [] }: RegionMapPreviewProps) {
  const router = useRouter();
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [originalGeoData, setOriginalGeoData] = useState<FeatureCollection | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [layerName, setLayerName] = useState("");
  const [layerColor, setLayerColor] = useState("#000000");
  const [layerOpacity, setLayerOpacity] = useState([20]); // 0 to 100
  const [layerWeight, setLayerWeight] = useState([2]); // 1 to 10

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

    try {
      let previewGeoData: FeatureCollection | null = null;

      const text = await file.text();
      const parsed = JSON.parse(text);

      if (parsed.type === "FeatureCollection") {
        previewGeoData = parsed;
      } else if (parsed.type === "Feature") {
        previewGeoData = { type: "FeatureCollection", features: [parsed] };
      } else {
        previewGeoData = {
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

      setGeoData(previewGeoData);
      setIsPreviewing(true);
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
  };

  const handleSave = async () => {
    if (!uploadedFile) return;
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      formData.append("layerConfig", JSON.stringify({
        name: layerName || `Camada Base ${Math.floor(Math.random() * 1000)}`,
        color: layerColor,
        fillOpacity: layerOpacity[0] / 100,
        weight: layerWeight[0]
      }));

      const response = await fetch(`/api/admin/regions/${regionId}/commit-layer`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to save layer.");
      }

      setIsPreviewing(false);
      setUploadedFile(null);
      router.refresh();

    } catch (error) {
      console.error("Save failed:", error);
      alert(error instanceof Error ? error.message : "Erro ao salvar camada.");
    } finally {
      setIsSaving(false);
    }
  };

  const defaultCenter = { longitude: -46.6333, latitude: -23.5505, zoom: 9 };
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (geoData && mapRef.current) {
      try {
        const [minLng, minLat, maxLng, maxLat] = bbox(geoData);
        mapRef.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat]
          ],
          { padding: 40, duration: 1000 }
        );
      } catch (e) {
        console.error("Failed to fit bounds", e);
      }
    }
  }, [geoData]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 relative z-0">
      
      {/* Modern Card Header */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative mt-4">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100 dark:border-blue-900/50">
             <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 leading-tight">
              Mapa e Camadas Base
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
              Visualize os limites da região, adicione ou estilize as sobreposições georreferenciadas complementares.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center shrink-0">
          {isPreviewing ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelPreview}
              disabled={isSaving}
              className="h-10 rounded-lg text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 font-medium px-4 shadow-sm transition-all"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Descartar Arquivo
            </Button>
          ) : (
             <GeoJsonUploader
                onUpload={handleGeoJsonUpload}
                isUploading={isLoading}
             />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Map Column */}
        <div className="col-span-1 xl:col-span-3">
          <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm relative z-0 bg-neutral-100 dark:bg-neutral-950">

            {isLoading && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm transition-opacity">
                <div className="flex flex-col items-center gap-3 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Processando geometria...</span>
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
              {geoData && (
                <Source id="main-region-source" type="geojson" data={geoData}>
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
        </div>

        {/* Options Column */}
        <div className="col-span-1 flex flex-col gap-6">
          {isPreviewing ? (
            <div className="bg-white dark:bg-neutral-900 border-2 border-emerald-500/50 dark:border-emerald-500/30 rounded-2xl shadow-lg flex flex-col h-[600px] overflow-hidden">
               <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 shrink-0 bg-emerald-50 dark:bg-emerald-950/20">
                 <h3 className="font-semibold text-lg flex items-center gap-2 text-emerald-900 dark:text-emerald-400 leading-tight">
                   <Layers className="w-5 h-5" /> Configurando Camada
                 </h3>
                 <p className="text-xs text-emerald-700/80 dark:text-emerald-500/70 mt-1">
                   Ajuste o estilo antes de aplicar ao mapa.
                 </p>
               </div>

               <div className="flex-1 p-5 overflow-y-auto space-y-7">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Nome da Camada</Label>
                    <Input
                      value={layerName}
                      onChange={(e) => setLayerName(e.target.value)}
                      placeholder="Ex: Zona de Amortecimento..."
                      className="h-11 bg-neutral-50 dark:bg-neutral-950/50 text-base shadow-sm font-medium"
                    />
                  </div>

                  <div className="bg-neutral-50/50 dark:bg-neutral-950/20 rounded-xl border border-neutral-100 dark:border-neutral-800 p-5 space-y-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="space-y-4">
                      <Label className="text-sm font-semibold flex items-center justify-between text-neutral-800 dark:text-neutral-200">
                        <span>Cor Dominante</span>
                        <span className="font-mono text-xs text-neutral-500 bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded uppercase">{layerColor}</span>
                      </Label>
                      <div className="flex gap-5 items-center">
                        <div className="relative w-14 h-14 rounded-xl shadow-md overflow-hidden shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-700 cursor-pointer group">
                          <input
                            type="color"
                            value={layerColor}
                            onChange={(e) => setLayerColor(e.target.value)}
                            className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                          />
                          <div className="absolute inset-0 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.2)] pointer-events-none rounded-xl"></div>
                        </div>
                        <div className="flex-1 space-y-3">
                           <Label className="text-xs font-semibold text-neutral-500 flex justify-between">
                             <span>Espessura da linha</span>
                             <strong className="text-neutral-900 dark:text-neutral-100">{layerWeight[0]}px</strong>
                           </Label>
                           <Slider
                             value={layerWeight}
                             onValueChange={setLayerWeight}
                             max={10}
                             min={1}
                             step={1}
                             className="py-1"
                           />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-5 border-t border-neutral-200 dark:border-neutral-800">
                      <Label className="text-sm font-semibold flex justify-between text-neutral-800 dark:text-neutral-200">
                        <span>Opacidade do Preenchimento</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">{layerOpacity[0]}%</strong>
                      </Label>
                      <Slider
                        value={layerOpacity}
                        onValueChange={setLayerOpacity}
                        max={100}
                        step={5}
                        className="py-1"
                      />
                      <p className="text-[11px] leading-tight text-neutral-500 mt-2">
                        Dica: Opacidades mais baixas permitem enxergar os mapas e satélites por baixo da camada.
                      </p>
                    </div>
                  </div>
               </div>

               <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 shrink-0 bg-neutral-50 dark:bg-neutral-950/50">
                  <Button
                     onClick={handleSave}
                     disabled={isSaving}
                     className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-base shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
                   >
                     {isSaving ? (
                       <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Salvando Camada...</>
                     ) : (
                       <><Save className="w-5 h-5 mr-2" /> Adicionar ao Mapa</>
                     )}
                  </Button>
               </div>
            </div>
          ) : (
             <div className="h-[600px]">
                <BaseLayersManager
                  regionId={regionId}
                  layers={baseLayers}
                  onLayerUpdate={() => router.refresh()}
                />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
