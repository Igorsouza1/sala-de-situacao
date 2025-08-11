import { db } from "@/db";



export async function findAllPropriedadesDataWithGeometry(){
    const result = await db.execute(`
        SELECT id, cod_tema, nom_tema, cod_imovel, mod_fiscal, num_area, ind_status, ind_tipo, des_condic, municipio, ST_AsGeoJSON(geom) as geojson
        FROM "rio_da_prata"."propriedades"
      `)

      return result
    }