import { db } from '@/db';
import { sql } from 'drizzle-orm';
import type { MapFeatureCollection, LayerScope } from '@/types/map-dto';

export interface ResolverSchemaConfig {
  sourceType?: string;
  tableName?: string;
  geometryColumn?: string;
  dateColumn?: string;
}

export interface ResolveOptions {
  tenantId: string;
  regiaoId?: number;
  startDate?: Date;
  endDate?: Date;
  minArea?: number;
  maxArea?: number;
}

// tableName vem sempre do banco (catalog), nunca do request
const ALLOWED_TABLES = new Set([
  'acoes', 'estradas', 'desmatamento', 'raw_firms', 'propriedades',
]);

/**
 * Resolve dados GeoJSON para uma camada com sourceType='table'.
 * Aplica filtro de scope (tenant/region/global), data e área.
 * Substitui gradualmente os STATIC_STRATEGIES do layerService.
 */
export async function resolveTableLayer(
  config: ResolverSchemaConfig,
  scope: LayerScope,
  options: ResolveOptions,
): Promise<MapFeatureCollection> {
  const { tableName, geometryColumn = 'geom', dateColumn } = config;

  if (!tableName || !ALLOWED_TABLES.has(tableName)) {
    throw new Error(`Table not in resolver whitelist: ${tableName}`);
  }

  const whereParts: ReturnType<typeof sql>[] = [];

  switch (scope) {
    case 'tenant':
      whereParts.push(sql`tenant_id = ${options.tenantId}::uuid`);
      break;
    case 'region':
      if (options.regiaoId) {
        // Filtra espacialmente pela geometria da região — usa índice GiST
        whereParts.push(sql`ST_Intersects(
          ${sql.identifier(geometryColumn)},
          (SELECT geom FROM monitoramento.regioes WHERE id = ${options.regiaoId})
        )`);
      } else {
        // Sem regiaoId: fallback para tenant_id para não retornar dataset nacional inteiro
        whereParts.push(sql`tenant_id = ${options.tenantId}::uuid`);
      }
      break;
    case 'global':
      // sem filtro — dados de referência global
      break;
  }

  if (dateColumn) {
    if (options.startDate) whereParts.push(sql`${sql.identifier(dateColumn)} >= ${options.startDate}`);
    if (options.endDate)   whereParts.push(sql`${sql.identifier(dateColumn)} <= ${options.endDate}`);
  }

  // Filtro de área (específico de propriedades — coluna area_ha)
  if (options.minArea !== undefined) whereParts.push(sql`area_ha >= ${options.minArea}`);
  if (options.maxArea !== undefined) whereParts.push(sql`area_ha <= ${options.maxArea}`);

  const whereClause = whereParts.length
    ? sql.join(whereParts, sql` AND `)
    : sql`TRUE`;

  const result = await db.execute(sql`
    SELECT t.*, ST_AsGeoJSON(t.${sql.identifier(geometryColumn)}) AS geojson
    FROM monitoramento.${sql.identifier(tableName)} t
    WHERE ${whereClause}
  `);

  return rowsToFeatureCollection(result.rows as any[], geometryColumn);
}

function rowsToFeatureCollection(rows: any[], geometryColumn: string): MapFeatureCollection {
  const features = rows
    .map(row => {
      const { geojson, [geometryColumn]: _rawGeom, ...props } = row;
      if (!geojson) return null;
      let geometry: any;
      try {
        geometry = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;
      } catch {
        return null;
      }
      if (!geometry?.type) return null;
      return { type: 'Feature' as const, id: row.id, geometry, properties: props };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  return { type: 'FeatureCollection', features };
}
