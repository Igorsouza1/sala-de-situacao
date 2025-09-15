import { db } from "@/db"
import { findAllDesmatamentoDataWithGeometry } from "./desmatamentoReposiroty"
import { findAllPropriedadesDataWithGeometry } from "./propriedadesRepository"
import { findAllFirmsDataWithGeometry } from "./firmsRepository"
import { findAllEstradasDataWithGeometry } from "./estradasRepository"
import { sql } from "drizzle-orm"

export async function findAllMapLayersData(regiaoId: number){
    const [estradas, bacia_rio_da_prata, leito_rio_da_prata, desmatamento, propriedades, firms, banhado_rio_da_prata] = await Promise.all([
        findAllEstradasDataWithGeometry(regiaoId),
        db.execute(sql`
          SELECT id, ST_AsGeoJSON(geom) as geojson
          FROM "Bacia_Rio_Da_Prata"
          WHERE regiao_id = ${regiaoId}
        `),
        db.execute(sql`
          SELECT id, ST_AsGeoJSON(geom) as geojson
          FROM "Leito_Rio_Da_Prata"
          WHERE regiao_id = ${regiaoId}
        `),
        findAllDesmatamentoDataWithGeometry(regiaoId),
        findAllPropriedadesDataWithGeometry(regiaoId),
        findAllFirmsDataWithGeometry(regiaoId),
        
        db.execute(sql`
          SELECT id, ST_AsGeoJSON(geom) as geojson
          FROM "Banhado_Rio_Da_Prata"
          WHERE regiao_id = ${regiaoId}
        `),
        
      ])

      return {
        estradas: estradas.rows,
        bacia_rio_da_prata: bacia_rio_da_prata.rows,
        leito_rio_da_prata: leito_rio_da_prata.rows,
        desmatamento: desmatamento.rows,
        propriedades: propriedades.rows,
        firms: firms.rows,
        banhado_rio_da_prata: banhado_rio_da_prata.rows,
      }
}