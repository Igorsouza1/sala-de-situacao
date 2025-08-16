import { db } from "@/db"
import { ponteDoCureInRioDaPrata } from "@/db/schema"
import { gte, lte } from "drizzle-orm"



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


export async function findPonteDataByDateRange(startDate: string, endDate: string){
  let query = db
    .select()
    .from(ponteDoCureInRioDaPrata).$dynamic()

  if(startDate){
      query = query.where(gte(ponteDoCureInRioDaPrata.data, startDate))
  }

  if(endDate){
      query = query.where(lte(ponteDoCureInRioDaPrata.data, endDate))
  }

  const result = await query.execute()

  return result
}