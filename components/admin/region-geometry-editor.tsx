"use client";

import { useEffect, useState } from "react";
import { MapContainer, GeoJSON, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export type GeoJSONGeometry =
  | { type: "Polygon";      coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

type CoordSystem = "geographic" | "projected";

type Props = {
  value: GeoJSONGeometry | null;
  onChange: (geom: GeoJSONGeometry | null) => void;
};

// ── helpers ──────────────────────────────────────────────────────────────────

function extractGeometry(raw: unknown): GeoJSONGeometry | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  if (obj.type === "FeatureCollection") {
    const feats = (obj.features as unknown[]) ?? [];
    if (!feats.length) return null;

    // Coleta todos os anéis de todas as features e funde num único MultiPolygon
    const rings: number[][][][] = [];
    for (const feat of feats) {
      const geom = extractGeometry(feat);
      if (!geom) continue;
      if (geom.type === "Polygon")      rings.push(geom.coordinates);
      if (geom.type === "MultiPolygon") rings.push(...geom.coordinates);
    }
    if (!rings.length) return null;
    // Se só um anel, devolve Polygon puro; senão MultiPolygon
    return rings.length === 1
      ? { type: "Polygon",      coordinates: rings[0] }
      : { type: "MultiPolygon", coordinates: rings };
  }

  if (obj.type === "Feature") {
    return extractGeometry((obj as Record<string, unknown>).geometry);
  }
  if (obj.type === "Polygon" || obj.type === "MultiPolygon") {
    return obj as GeoJSONGeometry;
  }
  return null;
}

function sampleCoord(geom: GeoJSONGeometry): [number, number] | null {
  if (geom.type === "Polygon") {
    const pt = geom.coordinates[0]?.[0];
    return pt ? [pt[0], pt[1]] : null;
  }
  const pt = geom.coordinates[0]?.[0]?.[0];
  return pt ? [pt[0], pt[1]] : null;
}

function detectCRS(geom: GeoJSONGeometry): CoordSystem {
  const pt = sampleCoord(geom);
  if (!pt) return "geographic";
  const [x, y] = pt;
  // Geographic: lon ∈ [-180, 180], lat ∈ [-90, 90]
  return Math.abs(x) <= 180 && Math.abs(y) <= 90 ? "geographic" : "projected";
}

function countVertices(geom: GeoJSONGeometry): number {
  if (geom.type === "Polygon") return geom.coordinates.flat().length;
  return geom.coordinates.flat(2).length;
}

// ── map helper ───────────────────────────────────────────────────────────────

function FitBounds({ geom }: { geom: GeoJSONGeometry }) {
  const map = useMap();
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer = L.geoJSON(geom as any);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
    } catch {
      /* geometria inválida para Leaflet — ignora */
    }
  }, [geom, map]);
  return null;
}

// ── component ────────────────────────────────────────────────────────────────

export function RegionGeometryEditor({ value, onChange }: Props) {
  const [text, setText]           = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [crs, setCrs]             = useState<CoordSystem | null>(null);

  const vertices = value ? countVertices(value) : 0;
  const canPreview = value && crs === "geographic";

  // key força re-mount do MapContainer quando a geometria muda
  const mapKey = value
    ? `${value.type}-${JSON.stringify(value.coordinates[0]).slice(0, 40)}`
    : "empty";

  const apply = () => {
    setParseError(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setParseError("Cole um GeoJSON antes de aplicar.");
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      const geom = extractGeometry(parsed);
      if (!geom) {
        setParseError(
          "Tipo não suportado. Use Polygon, MultiPolygon, Feature ou FeatureCollection."
        );
        return;
      }
      const detectedCrs = detectCRS(geom);
      setCrs(detectedCrs);
      onChange(geom);
      setText("");
    } catch {
      setParseError("JSON inválido — verifique a formatação.");
    }
  };

  const clear = () => {
    onChange(null);
    setText("");
    setParseError(null);
    setCrs(null);
  };

  return (
    <div className="space-y-3">

      {/* ── status bar ── */}
      {value && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono font-medium text-neutral-700">
            {value.type}
          </span>
          <span className="text-neutral-500 text-xs">{vertices.toLocaleString("pt-BR")} vértices</span>

          {crs === "geographic" && (
            <span className="flex items-center gap-1 text-green-700 text-xs ml-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Coordenadas geográficas (graus)
            </span>
          )}

          {crs === "projected" && (
            <span className="flex items-center gap-1 text-amber-700 text-xs ml-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Coordenadas projetadas (metros) — reprojetar para SIRGAS2000 / EPSG:4674
            </span>
          )}

          <Button
            type="button" variant="ghost" size="sm"
            className="ml-auto h-7 text-xs text-red-600 hover:text-red-700"
            onClick={clear}
          >
            Remover
          </Button>
        </div>
      )}

      {/* ── aviso CRS projetado ── */}
      {crs === "projected" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-1">
          <p className="font-medium">Atenção: coordenadas em sistema projetado (UTM/metros)</p>
          <p>
            O banco armazena em SIRGAS2000 (EPSG:4674, graus decimais). Para salvar corretamente,
            reprojetar no QGIS:{" "}
            <span className="font-mono">Vetor → Ferramentas de Geometria → Reprojetar → EPSG:4674</span>
            {" "}e exportar como GeoJSON.
          </p>
          <p className="text-amber-600">
            Preview desabilitado para dados projetados (Leaflet opera em graus).
          </p>
        </div>
      )}

      {/* ── mapa preview ── */}
      {canPreview ? (
        <div className="h-72 overflow-hidden rounded-lg border">
          <MapContainer center={[-16.5, -55]} zoom={4} className="h-full w-full" key={mapKey}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <GeoJSON data={value as any} style={{ color: "#2563eb", weight: 2, fillOpacity: 0.15 }} />
            <FitBounds geom={value} />
          </MapContainer>
        </div>
      ) : !value ? (
        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed text-sm text-neutral-400">
          Preview aparece aqui após aplicar GeoJSON geográfico
        </div>
      ) : null}

      {/* ── textarea input ── */}
      <textarea
        className="w-full rounded-md border p-2 text-xs font-mono leading-relaxed"
        rows={7}
        placeholder={[
          'Cole aqui o GeoJSON — tipos aceitos:',
          '  { "type": "Polygon", "coordinates": [[[-57.1,-17.2], ...]] }',
          '  { "type": "MultiPolygon", "coordinates": [...] }',
          '  { "type": "Feature", "geometry": { ... } }',
          '  { "type": "FeatureCollection", "features": [...] }',
          '',
          'Coordenadas devem estar em graus decimais (EPSG:4674 ou EPSG:4326).',
        ].join("\n")}
        value={text}
        onChange={(e) => { setText(e.target.value); setParseError(null); }}
      />

      {parseError && <p className="text-sm text-red-600">{parseError}</p>}

      <Button type="button" variant="outline" onClick={apply} disabled={!text.trim()}>
        Aplicar GeoJSON
      </Button>
    </div>
  );
}
