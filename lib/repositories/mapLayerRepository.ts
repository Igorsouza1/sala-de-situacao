import { db } from "@/db"

export async function findAllMapLayersData(){
    const [estradas, bacia_rio_da_prata, leito_rio_da_prata, desmatamento, propriedades, firms, banhado_rio_da_prata] = await Promise.all([
        db.execute(`
          SELECT id, nome, tipo, codigo, ST_AsGeoJSON(geom) as geojson
          FROM "rio_da_prata"."estradas"
        `),
        db.execute(`
          SELECT id, ST_AsGeoJSON(geom) as geojson
          FROM "rio_da_prata"."Bacia_Rio_Da_Prata"
        `),
        db.execute(`
          SELECT id, ST_AsGeoJSON(geom) as geojson
          FROM "rio_da_prata"."Leito_Rio_Da_Prata"
        `),
        db.execute(`
          SELECT id, alertid, alertcode, alertha, source, detectat, detectyear, state, stateha, ST_AsGeoJSON(geom) as geojson
          FROM "rio_da_prata"."desmatamento"
        `),
        db.execute(`
          SELECT id, cod_tema, nom_tema, cod_imovel, mod_fiscal, num_area, ind_status, ind_tipo, des_condic, municipio, ST_AsGeoJSON(geom) as geojson
          FROM "rio_da_prata"."propriedades"
        `),
        db.execute(`
          SELECT  acq_date, acq_time, ST_AsGeoJSON(geom) as geojson
          FROM "rio_da_prata"."raw_firms"
        `),
        
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