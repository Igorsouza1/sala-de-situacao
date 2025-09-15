import { db } from "@/db";
import { sql } from "drizzle-orm";



export async function findAllPropriedadesDataWithGeometry(regiaoId: number){
    const result = await db.execute(sql`
        SELECT id, cod_tema, nom_tema, cod_imovel, mod_fiscal, num_area, ind_status, ind_tipo, des_condic, municipio, ST_AsGeoJSON(geom) as geojson
        FROM propriedades
        WHERE regiao_id = ${regiaoId}
      `)

      return result
    }