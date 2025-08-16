import { db } from "@/db"
import { ponteDoCureInRioDaPrata } from "@/db/schema"



export async function findAllPonteData(){
    const result = await db
      .select({
        mes: ponteDoCureInRioDaPrata.mes,
        data: ponteDoCureInRioDaPrata.data,
        chuva: ponteDoCureInRioDaPrata.chuva,
        nivel: ponteDoCureInRioDaPrata.nivel,
        visibilidade: ponteDoCureInRioDaPrata.visibilidade,
      })
      .from(ponteDoCureInRioDaPrata)
      .execute()

      return result
}