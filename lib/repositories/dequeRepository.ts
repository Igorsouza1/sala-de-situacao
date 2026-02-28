
import { db } from "@/db"
import { dequeDePedrasInMonitoramento } from "@/db/schema"
import { and, gte, lte } from "drizzle-orm"


export type NewDequeData = typeof dequeDePedrasInMonitoramento.$inferInsert;


export async function findAllDequeData() {
    const result = await db.select().from(dequeDePedrasInMonitoramento)

    return result

}

export async function findDequeDataByDateRange(startDate: string, endDate: string) {
    let query = db
        .select()
        .from(dequeDePedrasInMonitoramento).$dynamic()

    if (startDate) {
        query = query.where(gte(dequeDePedrasInMonitoramento.data, startDate))
    }

    if (endDate) {
        query = query.where(lte(dequeDePedrasInMonitoramento.data, endDate))
    }

    const result = await query.execute()

    return result
}



export async function insertDequeData(data: NewDequeData) {
    const [newRecord] = await db
        .insert(dequeDePedrasInMonitoramento)
        .values(data)
        .returning();

    return newRecord;
}