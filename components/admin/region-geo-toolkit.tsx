"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Map, { Source, Layer, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapMouseEvent } from "maplibre-gl";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Polygon, MultiPolygon, Position } from "geojson";
import {
  MousePointer2,
  Move,
  PenLine,
  Spline,
  Undo2,
  RotateCcw,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";

type Geom = Polygon | MultiPolygon;
type Mode = "view" | "move" | "vertices" | "draw";

interface Props {
  regionId: number;
  nome: string;
  descricao: string | null;
  organizationId: string | null;
  initialGeoJson: string | null;
}

// ── geometry helpers ─────────────────────────────────────────────────────────

function parseGeom(raw: string | null): Geom | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.type === "Polygon" || parsed.type === "MultiPolygon") return parsed;
    if (parsed.type === "Feature") return parseGeom(JSON.stringify(parsed.geometry));
    return null;
  } catch {
    return null;
  }
}

function toPolys(geom: Geom): Position[][][] {
  return geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
}

function fromPolys(polys: Position[][][]): Geom {
  return polys.length === 1
    ? { type: "Polygon", coordinates: polys[0] }
    : { type: "MultiPolygon", coordinates: polys };
}

function mapCoords(geom: Geom, fn: (p: Position) => Position): Geom {
  const polys = toPolys(geom).map((poly) => poly.map((ring) => ring.map(fn)));
  return fromPolys(polys);
}

function countVertices(geom: Geom): number {
  return toPolys(geom).reduce(
    (acc, poly) => acc + poly.reduce((a, ring) => a + ring.length, 0),
    0
  );
}

function asFeature(geom: Geom): Feature<Geom> {
  return { type: "Feature", geometry: geom, properties: {} };
}

// ── component ────────────────────────────────────────────────────────────────

export function RegionGeoToolkit({ regionId, nome, descricao, organizationId, initialGeoJson }: Props) {
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);

  const original = useMemo(() => parseGeom(initialGeoJson), [initialGeoJson]);
  const [geom, setGeom] = useState<Geom | null>(original);
  const [history, setHistory] = useState<Geom[]>([]);
  const [mode, setMode] = useState<Mode>("view");
  const [bufferKm, setBufferKm] = useState(1);
  const [drawPoints, setDrawPoints] = useState<Position[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // refs to avoid stale closures inside native map event handlers
  const geomRef = useRef(geom);
  geomRef.current = geom;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const dirty = geom !== original;
  const vertices = geom ? countVertices(geom) : 0;
  const areaKm2 = useMemo(() => (geom ? turf.area(asFeature(geom)) / 1e6 : 0), [geom]);
  const originalAreaKm2 = useMemo(
    () => (original ? turf.area(asFeature(original)) / 1e6 : 0),
    [original]
  );
  const tooManyVertices = vertices > 3000;

  const pushGeom = useCallback((next: Geom | null) => {
    if (!next) return;
    setHistory((h) => (geomRef.current ? [...h.slice(-49), geomRef.current] : h));
    setGeom(next);
    setSaved(false);
  }, []);

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      setGeom(h[h.length - 1]);
      setSaved(false);
      return h.slice(0, -1);
    });
  };

  const reset = () => {
    setGeom(original);
    setHistory([]);
    setDrawPoints([]);
    setMode("view");
    setSaved(false);
  };

  // ── tools ──

  const applyBuffer = (km: number) => {
    if (!geom) return;
    setBusy(true);
    setError(null);
    // defer so the spinner paints before the heavy turf call
    setTimeout(() => {
      try {
        const buffered = turf.buffer(asFeature(geom), km, { units: "kilometers" });
        if (!buffered || !buffered.geometry) {
          setError(km < 0 ? "Contração excede a área da região." : "Não foi possível aplicar o buffer.");
          return;
        }
        pushGeom(buffered.geometry as Geom);
      } catch {
        setError("Falha ao processar o buffer.");
      } finally {
        setBusy(false);
      }
    }, 30);
  };

  const applySimplify = () => {
    if (!geom) return;
    try {
      const simplified = turf.simplify(asFeature(geom), { tolerance: 0.001, highQuality: true });
      pushGeom(simplified.geometry as Geom);
    } catch {
      setError("Falha ao simplificar a geometria.");
    }
  };

  // ── move (drag whole shape) ──

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    let dragging = false;
    let start: Position | null = null;
    let startGeom: Geom | null = null;

    const onDown = (e: MapMouseEvent) => {
      if (modeRef.current !== "move" || !geomRef.current) return;
      const hits = map.queryRenderedFeatures(e.point, { layers: ["region-fill"] });
      if (hits.length === 0) return;
      dragging = true;
      start = [e.lngLat.lng, e.lngLat.lat];
      startGeom = geomRef.current;
      map.dragPan.disable();
      map.getCanvas().style.cursor = "grabbing";
      e.preventDefault();
    };

    const onMove = (e: MapMouseEvent) => {
      if (!dragging || !start || !startGeom) return;
      const dx = e.lngLat.lng - start[0];
      const dy = e.lngLat.lat - start[1];
      setGeom(mapCoords(startGeom, ([x, y]) => [x + dx, y + dy]));
    };

    const onUp = () => {
      if (!dragging || !startGeom) return;
      dragging = false;
      map.dragPan.enable();
      map.getCanvas().style.cursor = "";
      // commit: current geom is the moved one; history gets the pre-drag geom
      const moved = geomRef.current;
      setGeom(startGeom);
      if (moved && moved !== startGeom) {
        geomRef.current = startGeom;
        pushGeom(moved);
      }
      start = null;
      startGeom = null;
      setSaved(false);
    };

    map.on("mousedown", onDown);
    map.on("mousemove", onMove);
    map.on("mouseup", onUp);
    return () => {
      map.off("mousedown", onDown);
      map.off("mousemove", onMove);
      map.off("mouseup", onUp);
    };
  }, [pushGeom]);

  // ── vertex editing ──

  const vertexCollection = useMemo<FeatureCollection>(() => {
    if (mode !== "vertices" || !geom || tooManyVertices)
      return { type: "FeatureCollection", features: [] };
    const feats: Feature[] = [];
    toPolys(geom).forEach((poly, pi) =>
      poly.forEach((ring, ri) =>
        ring.slice(0, -1).forEach((pt, vi) => {
          feats.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: pt },
            properties: { pi, ri, vi },
          });
        })
      )
    );
    return { type: "FeatureCollection", features: feats };
  }, [geom, mode, tooManyVertices]);

  const midpointCollection = useMemo<FeatureCollection>(() => {
    if (mode !== "vertices" || !geom || tooManyVertices)
      return { type: "FeatureCollection", features: [] };
    const feats: Feature[] = [];
    toPolys(geom).forEach((poly, pi) =>
      poly.forEach((ring, ri) => {
        for (let vi = 0; vi < ring.length - 1; vi++) {
          const a = ring[vi];
          const b = ring[vi + 1];
          feats.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] },
            properties: { pi, ri, vi },
          });
        }
      })
    );
    return { type: "FeatureCollection", features: feats };
  }, [geom, mode, tooManyVertices]);

  const setVertex = useCallback((g: Geom, pi: number, ri: number, vi: number, pos: Position): Geom => {
    const polys = toPolys(g).map((poly, a) =>
      poly.map((ring, b) => {
        if (a !== pi || b !== ri) return ring;
        const next = ring.slice();
        next[vi] = pos;
        if (vi === 0) next[next.length - 1] = pos; // keep ring closed
        return next;
      })
    );
    return fromPolys(polys);
  }, []);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    let drag: { pi: number; ri: number; vi: number; startGeom: Geom } | null = null;

    const hitHandle = (point: MapMouseEvent["point"], layer: string) => {
      if (!map.getLayer(layer)) return null;
      const hits = map.queryRenderedFeatures(point, { layers: [layer] });
      return hits.length ? (hits[0].properties as { pi: number; ri: number; vi: number }) : null;
    };

    const onDown = (e: MapMouseEvent) => {
      if (modeRef.current !== "vertices" || !geomRef.current) return;

      const vtx = hitHandle(e.point, "vertex-handles");
      if (vtx) {
        drag = { ...vtx, startGeom: geomRef.current };
        map.dragPan.disable();
        e.preventDefault();
        return;
      }

      const mid = hitHandle(e.point, "midpoint-handles");
      if (mid) {
        // insert a vertex after `vi` and start dragging it
        const startGeom = geomRef.current;
        const polys = toPolys(startGeom).map((poly, a) =>
          poly.map((ring, b) => {
            if (a !== mid.pi || b !== mid.ri) return ring;
            const next = ring.slice();
            next.splice(mid.vi + 1, 0, [e.lngLat.lng, e.lngLat.lat]);
            return next;
          })
        );
        const withVertex = fromPolys(polys);
        setGeom(withVertex);
        geomRef.current = withVertex;
        drag = { pi: mid.pi, ri: mid.ri, vi: mid.vi + 1, startGeom };
        map.dragPan.disable();
        e.preventDefault();
      }
    };

    const onMove = (e: MapMouseEvent) => {
      if (!drag || !geomRef.current) return;
      setGeom(setVertex(geomRef.current, drag.pi, drag.ri, drag.vi, [e.lngLat.lng, e.lngLat.lat]));
    };

    const onUp = () => {
      if (!drag) return;
      const finalGeom = geomRef.current;
      const { startGeom } = drag;
      drag = null;
      map.dragPan.enable();
      if (finalGeom && finalGeom !== startGeom) {
        setGeom(startGeom);
        geomRef.current = startGeom;
        pushGeom(finalGeom);
      }
    };

    const onContext = (e: MapMouseEvent) => {
      if (modeRef.current !== "vertices" || !geomRef.current) return;
      const vtx = hitHandle(e.point, "vertex-handles");
      if (!vtx) return;
      e.preventDefault();
      const polys = toPolys(geomRef.current).map((poly, a) =>
        poly.map((ring, b) => {
          if (a !== vtx.pi || b !== vtx.ri) return ring;
          if (ring.length <= 4) return ring; // triangle minimum
          const next = ring.slice(0, -1);
          next.splice(vtx.vi, 1);
          next.push(next[0]);
          return next;
        })
      );
      pushGeom(fromPolys(polys));
    };

    map.on("mousedown", onDown);
    map.on("mousemove", onMove);
    map.on("mouseup", onUp);
    map.on("contextmenu", onContext);
    return () => {
      map.off("mousedown", onDown);
      map.off("mousemove", onMove);
      map.off("mouseup", onUp);
      map.off("contextmenu", onContext);
    };
  }, [pushGeom, setVertex]);

  // ── draw mode ──

  const handleMapClick = (e: { lngLat: { lng: number; lat: number } }) => {
    if (mode !== "draw") return;
    setDrawPoints((pts) => [...pts, [e.lngLat.lng, e.lngLat.lat]]);
  };

  const finishDraw = () => {
    if (drawPoints.length < 3) {
      setError("Marque pelo menos 3 pontos para fechar o polígono.");
      return;
    }
    const ring = [...drawPoints, drawPoints[0]];
    pushGeom({ type: "Polygon", coordinates: [ring] });
    setDrawPoints([]);
    setMode("view");
  };

  const cancelDraw = () => {
    setDrawPoints([]);
    setMode("view");
  };

  const drawPreview = useMemo<FeatureCollection>(() => {
    const feats: Feature[] = drawPoints.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: p },
      properties: {},
    }));
    if (drawPoints.length >= 2) {
      feats.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: drawPoints },
        properties: {},
      });
    }
    return { type: "FeatureCollection", features: feats };
  }, [drawPoints]);

  // ── fit bounds on mount ──

  const fitToGeom = useCallback((g: Geom | null, animate = true) => {
    if (!g || !mapRef.current) return;
    try {
      const [minX, minY, maxX, maxY] = turf.bbox(asFeature(g));
      mapRef.current.fitBounds(
        [[minX, minY], [maxX, maxY]],
        { padding: 60, duration: animate ? 800 : 0 }
      );
    } catch { /* geometria inválida — ignora */ }
  }, []);

  // ── save ──

  const save = async () => {
    if (!geom || !organizationId) {
      setError(!organizationId ? "Vincule uma organização antes de salvar a geometria." : null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/regions/${regionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, descricao, organizationId, geometry: geom }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao salvar.");
      }
      setSaved(true);
      setHistory([]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const toolBtn = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] transition-all active:scale-95 ${
      active
        ? "bg-[#0066cc] text-white"
        : "text-[#1d1d1f] hover:bg-black/5"
    }`;

  const cursor =
    mode === "draw" ? "crosshair" : mode === "move" ? "grab" : mode === "vertices" ? "default" : "";

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#e0e0e0] bg-white">

      {/* ── toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e0e0e0] bg-[#f5f5f7]/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-1">
          <button className={toolBtn(mode === "view")} onClick={() => { setMode("view"); setDrawPoints([]); }}>
            <MousePointer2 className="h-3.5 w-3.5" /> Navegar
          </button>
          <button className={toolBtn(mode === "move")} onClick={() => { setMode("move"); setDrawPoints([]); }} disabled={!geom}>
            <Move className="h-3.5 w-3.5" /> Mover
          </button>
          <button
            className={toolBtn(mode === "vertices")}
            onClick={() => { setMode("vertices"); setDrawPoints([]); }}
            disabled={!geom}
          >
            <Spline className="h-3.5 w-3.5" /> Vértices
          </button>
          <button className={toolBtn(mode === "draw")} onClick={() => setMode("draw")}>
            <PenLine className="h-3.5 w-3.5" /> Redesenhar
          </button>
        </div>

        <div className="mx-2 h-6 w-px bg-[#e0e0e0]" />

        {/* buffer control */}
        <div className="flex items-center gap-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-[#1d1d1f] transition-transform active:scale-95 disabled:opacity-40"
            onClick={() => applyBuffer(-bufferKm)}
            disabled={!geom || busy}
            title="Contrair área"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-baseline gap-1 text-[13px] text-[#1d1d1f]">
            <input
              type="number"
              min={0.1}
              step={0.5}
              value={bufferKm}
              onChange={(e) => setBufferKm(Math.max(0.1, Number(e.target.value) || 0.1))}
              className="w-14 rounded-lg border border-[#e0e0e0] bg-white px-2 py-1 text-center text-[13px] outline-none focus:border-[#0071e3]"
            />
            <span className="text-[#7a7a7a]">km</span>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-[#1d1d1f] transition-transform active:scale-95 disabled:opacity-40"
            onClick={() => applyBuffer(bufferKm)}
            disabled={!geom || busy}
            title="Expandir área"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {busy && <Loader2 className="h-4 w-4 animate-spin text-[#7a7a7a]" />}
        </div>

        <div className="mx-2 h-6 w-px bg-[#e0e0e0]" />

        <button
          className="rounded-full px-3 py-2 text-[13px] text-[#0066cc] transition-all hover:bg-black/5 active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent"
          onClick={applySimplify}
          disabled={!geom}
        >
          Simplificar
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#1d1d1f] transition-all hover:bg-black/5 active:scale-95 disabled:opacity-30"
            onClick={undo}
            disabled={history.length === 0}
            title="Desfazer"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#1d1d1f] transition-all hover:bg-black/5 active:scale-95 disabled:opacity-30"
            onClick={reset}
            disabled={!dirty && history.length === 0}
            title="Restaurar original"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            className="ml-2 rounded-full bg-[#0066cc] px-[18px] py-[8px] text-[13px] text-white transition-all hover:bg-[#0066cc]/90 active:scale-95 disabled:opacity-40"
            onClick={save}
            disabled={!dirty || saving || !geom}
          >
            {saving ? "Salvando…" : "Salvar geometria"}
          </button>
        </div>
      </div>

      {/* ── contextual hint / draw actions ── */}
      {(mode !== "view" || error || saved) && (
        <div className="flex items-center gap-3 border-b border-[#e0e0e0] bg-white px-4 py-2 text-[13px]">
          {mode === "move" && <span className="text-[#7a7a7a]">Arraste o polígono para reposicioná-lo.</span>}
          {mode === "vertices" && !tooManyVertices && (
            <span className="text-[#7a7a7a]">
              Arraste os pontos azuis. Clique nos pontos claros para inserir um vértice; botão direito remove.
            </span>
          )}
          {mode === "vertices" && tooManyVertices && (
            <span className="text-amber-700">
              {vertices.toLocaleString("pt-BR")} vértices — muitos para edição manual. Use “Simplificar” primeiro.
            </span>
          )}
          {mode === "draw" && (
            <>
              <span className="text-[#7a7a7a]">
                Clique no mapa para marcar pontos ({drawPoints.length}). O novo polígono substitui o atual.
              </span>
              <button className="text-[#0066cc]" onClick={finishDraw} disabled={drawPoints.length < 3}>
                Concluir
              </button>
              <button className="text-[#7a7a7a]" onClick={cancelDraw}>
                Cancelar
              </button>
            </>
          )}
          {error && <span className="text-red-600">{error}</span>}
          {saved && !error && <span className="text-green-700">Geometria salva.</span>}
        </div>
      )}

      {/* ── map ── */}
      <div className="relative h-[560px] w-full">
        <Map
          ref={mapRef}
          initialViewState={{ longitude: -55, latitude: -16.5, zoom: 4 }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          style={{ width: "100%", height: "100%", cursor }}
          onClick={handleMapClick}
          onLoad={() => fitToGeom(geomRef.current, false)}
          doubleClickZoom={mode !== "draw"}
          onDblClick={(e) => {
            if (mode === "draw") {
              e.preventDefault();
              finishDraw();
            }
          }}
        >
          {geom && (
            <Source id="region" type="geojson" data={asFeature(geom)}>
              <Layer
                id="region-fill"
                type="fill"
                paint={{ "fill-color": "#0066cc", "fill-opacity": dirty ? 0.18 : 0.12 }}
              />
              <Layer
                id="region-line"
                type="line"
                paint={{
                  "line-color": "#0066cc",
                  "line-width": 2,
                  ...(dirty ? { "line-dasharray": [2, 1.5] } : {}),
                }}
              />
            </Source>
          )}

          {/* original outline for comparison while dirty */}
          {dirty && original && (
            <Source id="region-original" type="geojson" data={asFeature(original)}>
              <Layer
                id="region-original-line"
                type="line"
                paint={{ "line-color": "#7a7a7a", "line-width": 1, "line-opacity": 0.6 }}
              />
            </Source>
          )}

          {mode === "vertices" && (
            <>
              <Source id="midpoints" type="geojson" data={midpointCollection}>
                <Layer
                  id="midpoint-handles"
                  type="circle"
                  paint={{
                    "circle-radius": 4,
                    "circle-color": "#ffffff",
                    "circle-opacity": 0.9,
                    "circle-stroke-width": 1.5,
                    "circle-stroke-color": "#0066cc",
                    "circle-stroke-opacity": 0.5,
                  }}
                />
              </Source>
              <Source id="vertices" type="geojson" data={vertexCollection}>
                <Layer
                  id="vertex-handles"
                  type="circle"
                  paint={{
                    "circle-radius": 5.5,
                    "circle-color": "#0066cc",
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#ffffff",
                  }}
                />
              </Source>
            </>
          )}

          {mode === "draw" && (
            <Source id="draw-preview" type="geojson" data={drawPreview}>
              <Layer
                id="draw-line"
                type="line"
                filter={["==", ["geometry-type"], "LineString"]}
                paint={{ "line-color": "#0066cc", "line-width": 2, "line-dasharray": [2, 1.5] }}
              />
              <Layer
                id="draw-points"
                type="circle"
                filter={["==", ["geometry-type"], "Point"]}
                paint={{
                  "circle-radius": 5,
                  "circle-color": "#0066cc",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                }}
              />
            </Source>
          )}
        </Map>

        {/* recenter */}
        {geom && (
          <button
            className="absolute bottom-4 right-4 rounded-full border border-[#e0e0e0] bg-white/90 px-4 py-2 text-[13px] text-[#1d1d1f] backdrop-blur transition-transform active:scale-95"
            onClick={() => fitToGeom(geom)}
          >
            Centralizar
          </button>
        )}
      </div>

      {/* ── stats footer ── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-[#e0e0e0] px-5 py-3 text-[13px] text-[#7a7a7a]">
        <span>
          Área:{" "}
          <strong className="font-semibold text-[#1d1d1f]">
            {areaKm2.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km²
          </strong>
        </span>
        {dirty && originalAreaKm2 > 0 && (
          <span className={areaKm2 >= originalAreaKm2 ? "text-green-700" : "text-amber-700"}>
            {areaKm2 >= originalAreaKm2 ? "+" : ""}
            {(((areaKm2 - originalAreaKm2) / originalAreaKm2) * 100).toLocaleString("pt-BR", {
              maximumFractionDigits: 1,
            })}
            % vs. original
          </span>
        )}
        <span>{vertices.toLocaleString("pt-BR")} vértices</span>
        <span>{geom?.type === "MultiPolygon" ? `${geom.coordinates.length} polígonos` : "1 polígono"}</span>
        {dirty && <span className="ml-auto text-[#0066cc]">Alterações não salvas</span>}
      </div>
    </div>
  );
}
