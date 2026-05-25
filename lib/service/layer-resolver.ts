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

// Colunas de propriedades por tabela — exclui geom binário para não dobrar egress
const TABLE_DISPLAY_COLUMNS: Record<string, string> = {
  acoes: 'id, tenant_id, acao, name, descricao, mes, atuacao, status, categoria, tipo, eixo_tematico, tipo_tecnico, carater, time',
  estradas: 'id, tenant_id, nome, tipo, codigo',
  desmatamento: 'id, tenant_id, alertid, alertcode, alertha, source, detectat, detectyear, state, stateha',
  raw_firms: 'id, tenant_id, acq_date, acq_time, frp, satellite, cod_imovel',
  propriedades: 'id, tenant_id, cod_tema, nom_tema, cod_imovel, mod_fiscal, num_area, ind_status, ind_tipo, des_condic, municipio',
};

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
    // Cast tanto coluna quanto parâmetro para ::date para suportar TEXT (detectat) e DATE (acq_date)
    if (options.startDate) {
      const d = options.startDate.toISOString().split('T')[0];
      whereParts.push(sql`${sql.identifier(dateColumn)}::date >= ${d}::date`);
    }
    if (options.endDate) {
      const d = options.endDate.toISOString().split('T')[0];
      whereParts.push(sql`${sql.identifier(dateColumn)}::date <= ${d}::date`);
    }
  }

  // Filtro de área: só para tabela propriedades (coluna num_area)
  if (tableName === 'propriedades') {
    if (options.minArea !== undefined) whereParts.push(sql`num_area >= ${options.minArea}`);
    if (options.maxArea !== undefined) whereParts.push(sql`num_area <= ${options.maxArea}`);
  }

  const whereClause = whereParts.length
    ? sql.join(whereParts, sql` AND `)
    : sql`TRUE`;

  const displayCols = sql.raw(TABLE_DISPLAY_COLUMNS[tableName] ?? 'id, tenant_id');

  // Points (ST_Dimension=0) não precisam de simplificação; polígonos e linhas sim.
  // ST_SimplifyPreserveTopology mantém topologia válida; 0.0001° ≈ 11m de tolerância.
  const result = await db.execute(sql`
    SELECT ${displayCols},
      ST_AsGeoJSON(
        CASE WHEN ST_Dimension(t.${sql.identifier(geometryColumn)}) = 0
          THEN t.${sql.identifier(geometryColumn)}
          ELSE ST_SimplifyPreserveTopology(t.${sql.identifier(geometryColumn)}, 0.0001)
        END, 5
      ) AS geojson
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
