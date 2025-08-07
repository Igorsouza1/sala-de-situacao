// lib/repositories/fogoRepository.ts

import { db } from "@/db"
import { acoesInRioDaPrata, fotosAcoesInRioDaPrata } from "@/db/schema" // Usando a tabela que você definiu
import { eq, desc } from "drizzle-orm";

// Uma função que busca todos os dados
export async function findAllAcoesData() {
  // A única responsabilidade é executar a query e retornar os dados.
  const result = await db
    .select({
      id: acoesInRioDaPrata.id,
      name: acoesInRioDaPrata.name,
      latitude: acoesInRioDaPrata.latitude,
      longitude: acoesInRioDaPrata.longitude,
      elevation: acoesInRioDaPrata.elevation,
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

