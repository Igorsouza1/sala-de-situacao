
import { db } from "@/db"
import { dequeDePedrasInRioDaPrata } from "@/db/schema"

export async function findAllDequeData(){
    const result = await db.select().from(dequeDePedrasInRioDaPrata)

    return result

}