import { db } from "@/db";
import { sql } from "drizzle-orm";



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
      (SELECT COALESCE(SUM(alertha), 0)::float FROM "monitoramento"."desmatamento" d WHERE ST_Intersects(d.geom, p.geom)) as "desmatamentoArea"
    FROM prop p
  `;
  const result = await db.execute(query);
  return result.rows[0];
}