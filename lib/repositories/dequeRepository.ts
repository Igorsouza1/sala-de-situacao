
import { db } from "@/db"
import { dequeDePedrasInRioDaPrata } from "@/db/schema"
import { and, gte, lte } from "drizzle-orm"

export async function findAllDequeData(){
    const result = await db.select().from(dequeDePedrasInRioDaPrata)

    return result

}

export async function findDequeDataByDateRange(startDate: string, endDate: string){
    let query = db
      .select()
      .from(dequeDePedrasInRioDaPrata).$dynamic()

    if(startDate){
        query = query.where(gte(dequeDePedrasInRioDaPrata.data, startDate))
    }

    if(endDate){
        query = query.where(lte(dequeDePedrasInRioDaPrata.data, endDate))
    }

    const result = await query.execute()

    return result
}



export async function insertDequeData(data: DequeData){
    const result = await db.insert(dequeDePedrasInRioDaPrata).values(data)

    return result
}