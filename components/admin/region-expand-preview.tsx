"use client";

import { useEffect, useState, useRef } from "react";
import { FeatureCollection } from "geojson";
import { GeoJsonUploader } from "./geojson-uploader";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Save, Maximize } from "lucide-react";
import { useRouter } from "next/navigation";
import Map, { Source, Layer, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import bbox from "@turf/bbox";

interface RegionExpandPreviewProps {
  regionId: number;
  initialGeoJson: string | null;
}

export function RegionExpandPreview({ regionId, initialGeoJson }: RegionExpandPreviewProps) {
  const router = useRouter();
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [originalGeoData, setOriginalGeoData] = useState<FeatureCollection | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      const formData = new FormData();
      formData.append("regionId", regionId.toString());
      formData.append("isForUnion", "true");
      formData.append("file", file);

      const response = await fetch("/api/admin/regions/preview-union", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to generate union preview.");
      }

      setGeoData(data.data as FeatureCollection);
      setIsPreviewing(true);

    } catch (error) {
      console.error("Preview failed:", error);
      alert(error instanceof Error ? error.message : "Erro ao processar a união.");
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
      formData.append("expandBoundary", "true");
      formData.append("createBaseLayer", "false");
      formData.append("file", uploadedFile);

      const response = await fetch(`/api/admin/regions/${regionId}/commit-union`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to commit union.");
      }

      setIsPreviewing(false);
      setUploadedFile(null);
      router.push(`/admin/regions/${regionId}`);

    } catch (error) {
      console.error("Save failed:", error);
      alert(error instanceof Error ? error.message : "Erro ao salvar alterações");
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
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
            Pré-visualização da Fusão (ST_Union)
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Esta ação pode demorar dependendo do tamanho do arquivo.
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
            <GeoJsonUploader
              onUpload={handleGeoJsonUpload}
              isUploading={isLoading}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`col-span-1 ${isPreviewing ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm relative z-0">

            {isLoading && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">Calculando união geográfica...</span>
                </div>
              </div>
            )}

            <Map
              ref={mapRef}
              id={`region-map-expand-${regionId}`}
              initialViewState={defaultCenter}
              mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
              style={{ width: "100%", height: "100%" }}
            >
              {geoData && (
                <Source id="union-region-source" type="geojson" data={geoData}>
                  <Layer
                    id="union-region-fill"
                    type="fill"
                    paint={{
                      "fill-color": isPreviewing ? "#3b82f6" : "#10b981",
                      "fill-opacity": isPreviewing ? 0.4 : 0.2
                    }}
                  />
                  <Layer
                    id="union-region-line"
                    type="line"
                    paint={{
                      "line-color": isPreviewing ? "#2563eb" : "#10b981",
                      "line-width": 2
                    }}
                  />
                </Source>
              )}
            </Map>
          </div>
        </div>

        {isPreviewing && (
          <div className="col-span-1 space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg border-b pb-4 dark:border-neutral-800 flex items-center gap-2">
                <Maximize className="w-5 h-5 text-blue-500" /> Confirmar Expansão
              </h3>
              <p className="text-sm text-neutral-500 mt-4 leading-relaxed">
                Você está visualizando a união da fronteira atual com o novo arquivo. Se o resultado estiver correto, clique em salvar para substituir a geometria principal da região.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t dark:border-neutral-800">
               <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {isSaving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Salvar Nova Fronteira</>
                  )}
               </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}