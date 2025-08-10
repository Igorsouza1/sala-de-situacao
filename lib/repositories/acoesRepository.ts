// lib/repositories/fogoRepository.ts

import { db } from "@/db"
import { acoesInRioDaPrata, fotosAcoesInRioDaPrata } from "@/db/schema" // Usando a tabela que você definiu
import { eq, desc, sql } from "drizzle-orm";

// Uma função que busca todos os dados
export async function findAllAcoesData() {
  // A única responsabilidade é executar a query e retornar os dados.
  const result = await db
    .select({
      id: acoesInRioDaPrata.id,
      name: acoesInRioDaPrata.name,
      time: acoesInRioDaPrata.time,
      descricao: acoesInRioDaPrata.descricao,
      mes: acoesInRioDaPrata.mes,
      atuacao: acoesInRioDaPrata.atuacao,
      acao: acoesInRioDaPrata.acao,
    })
    .from(acoesInRioDaPrata)
    .execute()
  
  return result;
}

export async function findAllAcoesDataWithGeometry(){

  const result = await db.execute(`
    SELECT id, acao, name, descricao, mes, time, ST_AsGeoJSON(geom) as geojson
    FROM "rio_da_prata"."acoes"
  `)

    return result.rows
}


export async function findAllAcoesImagesData(id: number) {
  const result = await db
    .select({
      id: fotosAcoesInRioDaPrata.id,
      acaoId: fotosAcoesInRioDaPrata.acaoId,
      url: fotosAcoesInRioDaPrata.url,
      created_at: fotosAcoesInRioDaPrata.createdAt,
    })
    .from(fotosAcoesInRioDaPrata)
    .where(eq(fotosAcoesInRioDaPrata.acaoId, id))
    .orderBy(desc(fotosAcoesInRioDaPrata.createdAt))
    .execute()

    return result
}

export async function deleteAcaoById(id: number) {
  const result = await db
    .delete(acoesInRioDaPrata)
    .where(eq(acoesInRioDaPrata.id, id))
    .execute()
  return result
}

