import { db } from "@/db";
import { organizationsInMonitoramento } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";

export async function listOrganizationsInDb() {
  return db
    .select({
      id: organizationsInMonitoramento.id,
      name: organizationsInMonitoramento.name,
      maxRegions: organizationsInMonitoramento.maxRegions,
      createdAt: organizationsInMonitoramento.createdAt,
    })
    .from(organizationsInMonitoramento)
    .orderBy(asc(organizationsInMonitoramento.createdAt));
}

export async function createOrganizationInDb(input: { name: string; maxRegions: number }) {
  const [created] = await db
    .insert(organizationsInMonitoramento)
    .values({ name: input.name, maxRegions: input.maxRegions })
    .returning({
      id: organizationsInMonitoramento.id,
      name: organizationsInMonitoramento.name,
      maxRegions: organizationsInMonitoramento.maxRegions,
      createdAt: organizationsInMonitoramento.createdAt,
    });

  return created;
}

export async function updateOrganizationInDb(id: string, input: { name: string; maxRegions: number }) {
  const [updated] = await db
    .update(organizationsInMonitoramento)
    .set({ name: input.name, maxRegions: input.maxRegions })
    .where(eq(organizationsInMonitoramento.id, id))
    .returning({
      id: organizationsInMonitoramento.id,
      name: organizationsInMonitoramento.name,
      maxRegions: organizationsInMonitoramento.maxRegions,
      createdAt: organizationsInMonitoramento.createdAt,
    });

  return updated;
}

export async function deleteOrganizationInDb(id: string) {
  const [deleted] = await db
    .delete(organizationsInMonitoramento)
    .where(eq(organizationsInMonitoramento.id, id))
    .returning({ id: organizationsInMonitoramento.id });

  return deleted;
}

export type RegionListItem = {
  id: number;
  nome: string;
  organizationId: string | null;
  organizationName: string | null;
  sizeKm2: number;
  createdAt: string;
  geojson?: string;
};

export async function listRegionsInDb() {
  const result = await db.execute(sql<RegionListItem>`
    SELECT
      r.id,
      r.nome,
      r.metadata->>'organizationId' AS "organizationId",
      o.name AS "organizationName",
      ROUND(COALESCE(ST_Area(r.geom::geography) / 1000000.0, 0)::numeric, 2)::float8 AS "sizeKm2",
      r.created_at AS "createdAt"
    FROM monitoramento.regioes r
    LEFT JOIN monitoramento.organizations o
      ON o.id::text = r.metadata->>'organizationId'
    ORDER BY r.created_at DESC
  `);

  return result.rows as RegionListItem[];
}

export async function getRegionByIdInDb(id: number) {
  const result = await db.execute(sql<RegionListItem>`
    SELECT
      r.id,
      r.nome,
      r.metadata->>'organizationId' AS "organizationId",
      o.name AS "organizationName",
      ROUND(COALESCE(ST_Area(r.geom::geography) / 1000000.0, 0)::numeric, 2)::float8 AS "sizeKm2",
      r.created_at AS "createdAt",
      ST_AsGeoJSON(r.geom) as "geojson"
    FROM monitoramento.regioes r
    LEFT JOIN monitoramento.organizations o
      ON o.id::text = r.metadata->>'organizationId'
    WHERE r.id = ${id}
  `);

  return (result.rows[0] as RegionListItem) ?? null;
}

export async function getPropertiesByRegionInDb(regionId: number) {
  const result = await db.execute(sql`
    SELECT
      id,
      cod_imovel as "codImovel",
      nome,
      municipio,
      ST_AsGeoJSON(geom) as "geojson"
    FROM monitoramento.propriedades
    WHERE regiao_id = ${regionId}
    ORDER BY id DESC
  `);
  return result.rows as any[];
}

export async function getBaseLayersByRegionInDb(regionId: number) {
  const result = await db.execute(sql`
    SELECT
      c.id,
      c.name,
      c.slug,
      c.visual_config as "visualConfig",
      c.regiao_id as "regiaoId",
      (
        SELECT json_build_object(
          'type', 'FeatureCollection',
          'features', COALESCE(json_agg(
            json_build_object(
              'type', 'Feature',
              'geometry', ST_AsGeoJSON(d.geom)::json,
              'properties', d.properties
            )
          ), '[]'::json)
        )::text
        FROM monitoramento.layer_data d
        WHERE d.layer_id = c.id
      ) as geojson
    FROM monitoramento.layer_catalog c
    WHERE c.regiao_id = ${regionId}
      AND c.visual_config->>'category' = 'Base Territorial'
    ORDER BY c.ordering DESC, c.id DESC
  `);

  return result.rows as any[];
}

export async function createRegionInDb(input: {
  nome: string;
  organizationId: string;
  geojson: string;
}) {
  const result = await db.execute(sql<RegionListItem>`
    INSERT INTO monitoramento.regioes (nome, geom, metadata)
    VALUES (
      ${input.nome},
      ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(${input.geojson}), 4674)),
      jsonb_build_object('organizationId', ${input.organizationId})
    )
    RETURNING
      id,
      nome,
      metadata->>'organizationId' AS "organizationId",
      null::text AS "organizationName",
      ROUND(COALESCE(ST_Area(geom::geography) / 1000000.0, 0)::numeric, 2)::float8 AS "sizeKm2",
      created_at AS "createdAt"
  `);

  return (result.rows[0] as RegionListItem) ?? null;
}

export async function updateRegionInDb(
  id: number,
  input: { nome: string; organizationId: string; geojson: string }
) {
  const result = await db.execute(sql<RegionListItem>`
    UPDATE monitoramento.regioes
    SET
      nome = ${input.nome},
      geom = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(${input.geojson}), 4674)),
      metadata = jsonb_build_object('organizationId', ${input.organizationId}),
      updated_at = now()
    WHERE id = ${id}
    RETURNING
      id,
      nome,
      metadata->>'organizationId' AS "organizationId",
      null::text AS "organizationName",
      ROUND(COALESCE(ST_Area(geom::geography) / 1000000.0, 0)::numeric, 2)::float8 AS "sizeKm2",
      created_at AS "createdAt"
  `);

  return (result.rows[0] as RegionListItem) ?? null;
}

export async function updateRegionMetadataInDb(
  id: number,
  input: { nome: string; organizationId: string }
) {
  const result = await db.execute(sql<RegionListItem>`
    UPDATE monitoramento.regioes
    SET
      nome = ${input.nome},
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('organizationId', ${input.organizationId}::text),
      updated_at = now()
    WHERE id = ${id}
    RETURNING
      id,
      nome,
      metadata->>'organizationId' AS "organizationId",
      null::text AS "organizationName",
      ROUND(COALESCE(ST_Area(geom::geography) / 1000000.0, 0)::numeric, 2)::float8 AS "sizeKm2",
      created_at AS "createdAt"
  `);

  return (result.rows[0] as RegionListItem) ?? null;
}

export async function deleteRegionInDb(id: number) {
  const result = await db.execute(sql<{ id: number }>`
    DELETE FROM monitoramento.regioes
    WHERE id = ${id}
    RETURNING id
  `);

  return (result.rows[0] as { id: number }) ?? null;
}
