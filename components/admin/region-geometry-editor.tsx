"use client";

import { useMemo, useState } from "react";
import { MapContainer, Polygon, TileLayer, useMapEvents } from "react-leaflet";
import { Button } from "@/components/ui/button";

type Position = [number, number];

type Props = {
  value: Position[];
  onChange: (coords: Position[]) => void;
};

function ClickCapture({ onAdd }: { onAdd: (point: Position) => void }) {
  useMapEvents({
    click: (event) => {
      onAdd([event.latlng.lng, event.latlng.lat]);
    },
  });

  return null;
}

export function RegionGeometryEditor({ value, onChange }: Props) {
  const [geoJsonText, setGeoJsonText] = useState("");

  const mapPolygon = useMemo(() => value.map(([lng, lat]) => [lat, lng]) as [number, number][], [value]);

  const applyGeoJson = () => {
    try {
      const parsed = JSON.parse(geoJsonText);
      const feature = parsed.type === "Feature" ? parsed.geometry : parsed;
      if (feature.type !== "Polygon") return;
      const coords = (feature.coordinates?.[0] ?? []) as number[][];
      const normalized = coords.map(([lng, lat]) => [lng, lat] as Position);
      onChange(normalized);
    } catch {
      // no-op
    }
  };

  const addPoint = (point: Position) => {
    onChange([...value, point]);
  };

  const closePolygon = () => {
    if (value.length < 3) return;
    const first = value[0];
    const last = value[value.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      onChange([...value, first]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="h-64 overflow-hidden rounded-lg border">
        <MapContainer center={[-16.5, -55]} zoom={4} className="h-full w-full">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickCapture onAdd={addPoint} />
          {mapPolygon.length > 2 && <Polygon positions={mapPolygon} pathOptions={{ color: "#2563eb" }} />}
        </MapContainer>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={closePolygon}>
          Fechar polígono
        </Button>
        <Button type="button" variant="outline" onClick={() => onChange([])}>
          Limpar desenho
        </Button>
      </div>

      <textarea
        className="w-full rounded-md border p-2 text-sm"
        rows={5}
        placeholder='Colar GeoJSON Polygon/Feature e clicar em "Aplicar"'
        value={geoJsonText}
        onChange={(event) => setGeoJsonText(event.target.value)}
      />
      <Button type="button" variant="outline" onClick={applyGeoJson}>
        Aplicar GeoJSON
      </Button>
    </div>
  );
}
