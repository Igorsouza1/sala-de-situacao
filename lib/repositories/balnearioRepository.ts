import { db } from "@/db"
import { balnearioMunicipalInMonitoramento } from "@/db/schema"
import { and, gte, lte, desc, inArray } from "drizzle-orm"

export type NewBalnearioData = typeof balnearioMunicipalInMonitoramento.$inferInsert;

export async function findAllBalnearioData() {
  const result = await db.select().from(balnearioMunicipalInMonitoramento)
  return result
}

export async function findBalnearioDataByDateRange(startDate: string, endDate: string) {
  const conditions = []

  if (startDate) conditions.push(gte(balnearioMunicipalInMonitoramento.data, startDate))
  if (endDate)   conditions.push(lte(balnearioMunicipalInMonitoramento.data, endDate))

  const query = db
    .select()
    .from(balnearioMunicipalInMonitoramento)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(balnearioMunicipalInMonitoramento.data))

  return query.execute()
}

export async function insertBalnearioData(data: NewBalnearioData) {
  const [newRecord] = await db
    .insert(balnearioMunicipalInMonitoramento)
    .values(data)
    .returning();

  return newRecord;
}

export type UpsertResult = { inserted: number; updated: number };

export async function upsertBalnearioDataBatch(rows: NewBalnearioData[]): Promise<UpsertResult> {
  if (rows.length === 0) return { inserted: 0, updated: 0 };

  const dates = rows.map((r) => r.data).filter(Boolean) as string[];

  const existing = await db
    .select({ data: balnearioMunicipalInMonitoramento.data })
    .from(balnearioMunicipalInMonitoramento)
    .where(inArray(balnearioMunicipalInMonitoramento.data, dates))

  const existingDates = new Set(existing.map((r) => r.data));

  for (const row of rows) {
    await db
      .insert(balnearioMunicipalInMonitoramento)
      .values(row)
      .onConflictDoUpdate({
        target: balnearioMunicipalInMonitoramento.data,
        set: {
          turbidez:       row.turbidez,
          secchiVertical: row.secchiVertical,
          nivelAgua:      row.nivelAgua,
          pluviometria:   row.pluviometria,
          observacao:     row.observacao,
          mes:            row.mes,
        },
      });
  }

  const updated = dates.filter((d) => existingDates.has(d)).length;
  const inserted = dates.length - updated;

  return { inserted, updated };
}
