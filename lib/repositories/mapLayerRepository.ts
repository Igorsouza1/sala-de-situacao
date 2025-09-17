import { db } from "@/db"
import { findAllDesmatamentoDataWithGeometry } from "./desmatamentoReposiroty"
import { findAllPropriedadesDataWithGeometry } from "./propriedadesRepository"
import { findAllFirmsDataWithGeometry } from "./firmsRepository"
import { findAllEstradasDataWithGeometry } from "./estradasRepository"

export async function findAllMapLayersData(){
    const [estradas, bacia_rio_da_prata, leito_rio_da_prata, desmatamento, propriedades, firms, banhado_rio_da_prata] = await Promise.all([
        findAllEstradasDataWithGeometry(),
        db.execute(`
          SELECT id, ST_AsGeoJSON(geom) as geojson
          FROM "rio_da_prata"."Bacia_Rio_Da_Prata"
        `),
        db.execute(`
          SELECT id, ST_AsGeoJSON(geom) as geojson
          FROM "rio_da_prata"."Leito_Rio_Da_Prata"
        `),
        findAllDesmatamentoDataWithGeometry(),
        findAllPropriedadesDataWithGeometry(),
        findAllFirmsDataWithGeometry(),
        
        db.execute(`
          SELECT id, ST_AsGeoJSON(geom) as geojson
          FROM "rio_da_prata"."Banhado_Rio_Da_Prata"
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