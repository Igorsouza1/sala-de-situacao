type Position = [number, number];

type Geometry =
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] };

function extractRings(geometry: Geometry): Position[][] {
  if (geometry.type === "Polygon") return geometry.coordinates;
  return geometry.coordinates.flat();
}

/**
 * Renders a region's real geometry as a flat SVG silhouette.
 * Coordinates are lon/lat; the projection is a simple equirectangular
 * fit into the viewBox, which is fine for region-scale extents.
 */
export function RegionShape({
  geojson,
  className,
}: {
  geojson: string | null;
  className?: string;
}) {
  if (!geojson) return null;

  let geometry: Geometry;
  try {
    geometry = JSON.parse(geojson);
  } catch {
    return null;
  }
  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") return null;

  const rings = extractRings(geometry);
  const points = rings.flat();
  if (points.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const size = 100;
  const pad = 8;
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = (size - pad * 2) / Math.max(spanX, spanY);
  const offsetX = (size - spanX * scale) / 2;
  const offsetY = (size - spanY * scale) / 2;

  const project = ([x, y]: Position) =>
    `${(offsetX + (x - minX) * scale).toFixed(2)},${(offsetY + (maxY - y) * scale).toFixed(2)}`;

  const d = rings
    .map((ring) => `M${ring.map(project).join("L")}Z`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden="true">
      <path d={d} fill="currentColor" fillRule="evenodd" stroke="none" />
    </svg>
  );
}
