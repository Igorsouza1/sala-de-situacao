"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FeatureCollection, Feature, Geometry } from "geojson";
import { GeoJsonUploader } from "./geojson-uploader";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const GeoJSON = dynamic(
  () => import("react-leaflet").then((mod) => mod.GeoJSON),
  { ssr: false }
);

interface RegionMapPreviewProps {
  regionId: number;
  initialGeoJson: string | null;
}

export function RegionMapPreview({ regionId, initialGeoJson }: RegionMapPreviewProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [originalGeoData, setOriginalGeoData] = useState<FeatureCollection | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialGeoJson) {
      try {
        const parsed = JSON.parse(initialGeoJson);
        let collection: FeatureCollection | null = null;
        // Normalize to FeatureCollection for easy rendering
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

  const handleGeoJsonUpload = async (newFeature: FeatureCollection | Feature | Geometry) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/regions/preview-union", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          regionId,
          newFeature
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to generate preview.");
      }

      setGeoData(data.data as FeatureCollection);
      setIsPreviewing(true);

    } catch (error) {
      console.error("Preview failed:", error);
      alert(error instanceof Error ? error.message : "Erro ao gerar preview da união");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPreview = () => {
    setGeoData(originalGeoData);
    setIsPreviewing(false);
  };

  // Use a default center if no valid bounds can be easily extracted right away
  const defaultCenter: [number, number] = [-23.5505, -46.6333];

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

        <div className="flex flex-col sm:flex-row gap-3">
          {isPreviewing && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancelPreview}
              className="h-12 rounded-xl font-medium gap-2 px-6 shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Cancelar Preview
            </Button>
          )}

          <GeoJsonUploader
            onUpload={handleGeoJsonUpload}
            isUploading={isLoading}
          />
        </div>
      </div>

      <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm relative z-0">

        {isLoading && (
           <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
             <div className="flex flex-col items-center gap-3">
               <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
               <span className="font-medium text-neutral-800 dark:text-neutral-200">Processando união complexa...</span>
             </div>
           </div>
        )}

        <MapContainer
          id={`region-map-${regionId}`}
          center={defaultCenter}
          zoom={10}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geoData && (
            <GeoJSON
              key={JSON.stringify(geoData)}
              data={geoData}
              style={{
                color: "#10b981",
                weight: 2,
                fillOpacity: 0.2
              }}
            />
          )}
        </MapContainer>
      </div>

      {isPreviewing && (
         <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-200 text-sm flex justify-between items-center">
            <p><strong>Atenção:</strong> Você está visualizando um preview temporário. Nenhuma alteração foi salva definitivamente no banco de dados ainda.</p>
         </div>
      )}
    </div>
  );
}
