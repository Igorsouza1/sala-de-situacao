import { db } from "@/db";
import { sql } from "drizzle-orm";


export async function updatePropriedadeName(id: number, nome: string) {
  return await db.execute(sql`
    UPDATE "monitoramento"."propriedades"
    SET nome = ${nome}
    WHERE id = ${id}
  `);
}

export async function findAllPropriedadesDataWithGeometry() {
  const result = await db.execute(`
        SELECT id, cod_tema, nom_tema, cod_imovel, mod_fiscal, num_area, ind_status, ind_tipo, des_condic, municipio, ST_AsGeoJSON(geom) as geojson
        FROM "monitoramento"."propriedades"
      `)

  return result
}

export async function findPropriedadeDossieData(id: number) {
  const query = sql`
    WITH prop AS (
      SELECT * FROM "monitoramento"."propriedades" WHERE id = ${id}
    )
    SELECT
      p.id, 
      p.nome, 
      p.cod_imovel, 
      p.municipio, 
      p.num_area,
      ST_X(ST_Centroid(p.geom)) as "centerLng",
      ST_Y(ST_Centroid(p.geom)) as "centerLat",
      ST_AsGeoJSON(p.geom) as geojson,
      (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'categoria', a.categoria,
              'status', a.status,
              'date', a.time,
              'descricao', a.descricao,
              'type', a.tipo,
              'latitude', a.latitude,
              'longitude', a.longitude,
              'tipo_tecnico', a.tipo_tecnico,
              'carater', a.carater
            )
          ),
          '[]'::json
        )
        FROM "monitoramento"."acoes" a
        WHERE ST_Intersects(a.geom, p.geom)
      ) as "acoes",
      (SELECT COUNT(*)::int FROM "monitoramento"."raw_firms" f WHERE ST_Intersects(f.geom, p.geom)) as "focosCount",
      (SELECT COUNT(*)::int FROM "monitoramento"."desmatamento" d WHERE ST_Intersects(d.geom, p.geom)) as "desmatamentoCount",
      (SELECT COALESCE(SUM(alertha), 0)::float FROM "monitoramento"."desmatamento" d WHERE ST_Intersects(d.geom, p.geom)) as "desmatamentoArea",
      (
        SELECT COALESCE(
          ST_Area(
             ST_Intersection(
               p.geom,
               ST_Union(ST_Buffer(f.geom::geography, 187.5)::geometry)
             )
           ::geography) / 10000,
           0
        )::float
        FROM "monitoramento"."raw_firms" f
        WHERE ST_DWithin(f.geom::geography, p.geom::geography, 187.5)
      ) as "areaQueimada",
      (
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', f.id,
        'date', f.acq_date,
        'latitude', f.latitude,
        'longitude', f.longitude,
        'frp', f.frp
      )
      ORDER BY f.acq_date DESC
    ),
    '[]'::json
  )
  FROM (
    SELECT *
    FROM "monitoramento"."raw_firms"
    WHERE ST_Intersects(geom, p.geom)
    ORDER BY acq_date DESC
    LIMIT 5
  ) f
) as "focos",
      (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'id', d.id,
              'date', d.detectat,
              'area', d.alertha,
              'latitude', ST_Y(ST_Centroid(d.geom)),
              'longitude', ST_X(ST_Centroid(d.geom))
            ) ORDER BY d.detectat DESC
          ),
          '[]'::json
        )
        FROM "monitoramento"."desmatamento" d
        WHERE ST_Intersects(d.geom, p.geom)
      ) as "desmatamentos"
    FROM prop p
  `;
  const result = await db.execute(query);
  const row = result.rows[0];

  if (row) {
    // Flatten the result if needed or ensure the key matches the frontend expectation
    // But since we joined, it might be in the row depending on how we select it.
    // Let's adjust the SELECT list to include it explicitly if I didn't add it there.
    // Re-reading the query structure...
    // The previous structure was `SELECT ... FROM prop p`.
    // I should add the column to the main SELECT list instead of a LATERAL JOIN if I want to keep it simple,
    // OR use the LATERAL JOIN and select the column.
    // The previous implementation used subqueries in the SELECT list.
    // I will stick to the subquery pattern for consistency with "focosCount" etc.
    /* 
      (SELECT COALESCE(SUM(alertha), 0)::float FROM "monitoramento"."desmatamento" d WHERE ST_Intersects(d.geom, p.geom)) as "desmatamentoArea",
      -- New Column
      (
        SELECT COALESCE(
          ST_Area(
             ST_Intersection(
               p.geom,
               ST_Union(ST_Buffer(f.geom, 187.5))
             )
           ) / 10000,
           0
        )::float
        FROM "monitoramento"."raw_firms" f
        WHERE ST_Intersects(ST_Buffer(f.geom, 187.5), p.geom)
      ) as "areaQueimada"
      FROM prop p
    */
  }
  return result.rows[0];
}

export async function findAllPropertiesStats(limit = 50) {
  const query = sql`
    WITH stats AS (
      SELECT
        p.id,
        p.nome as name,
        p.cod_imovel as car,

        -- 1. Focos de calor
        (SELECT COUNT(*)::int 
         FROM "monitoramento"."raw_firms" f 
         WHERE f.cod_imovel = p.cod_imovel) as focos,

        -- 2. Desmatamento
        COALESCE((
          SELECT SUM(d.alertha) 
          FROM "monitoramento"."desmatamento" d 
          WHERE ST_Intersects(d.geom, p.geom)
        ), 0)::float as "desmatamentoHa",

        -- 3. Ações Passivas
        (
          SELECT COUNT(*)::int 
          FROM "monitoramento"."acoes" a 
          WHERE ST_Intersects(a.geom, p.geom) AND a.carater ILIKE '%Passivo%'
        ) as "acoesPassivos",

        -- 4. Ações Ativas
        (
          SELECT COUNT(*)::int 
          FROM "monitoramento"."acoes" a 
          WHERE ST_Intersects(a.geom, p.geom) AND a.carater ILIKE '%Ativo%'
        ) as "acoesAtivos"

      FROM "monitoramento"."propriedades" p
    )
    SELECT * FROM stats
    ORDER BY (focos + "acoesPassivos" + "acoesAtivos") DESC, "desmatamentoHa" DESC
    LIMIT ${limit}
  `;

  const result = await db.execute(query);
  return result.rows;
}