import { db } from "@/db"
import { balnearioMunicipalInMonitoramento } from "@/db/schema"
import { eq, and, gte, lte, desc, inArray } from "drizzle-orm"

export type NewBalnearioData = typeof balnearioMunicipalInMonitoramento.$inferInsert;

export async function findAllBalnearioData(tenantId: string) {
  const result = await db.select().from(balnearioMunicipalInMonitoramento).where(eq(balnearioMunicipalInMonitoramento.tenantId, tenantId))
  return result
}

export async function findBalnearioDataByDateRange(tenantId: string, startDate: string, endDate: string) {
  const conditions = [eq(balnearioMunicipalInMonitoramento.tenantId, tenantId)]

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
    .where(and(inArray(balnearioMunicipalInMonitoramento.data, dates), eq(balnearioMunicipalInMonitoramento.tenantId, rows[0].tenantId!)))

  const existingDates = new Set(existing.map((r) => r.data));

  for (const row of rows) {
    await db
      .insert(balnearioMunicipalInMonitoramento)
      .values(row)
      .onConflictDoUpdate({
        target: balnearioMunicipalInMonitoramento.data,
        setWhere: eq(balnearioMunicipalInMonitoramento.tenantId, row.tenantId!),
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
