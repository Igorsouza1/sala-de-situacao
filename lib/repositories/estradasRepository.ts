import { db, sql } from "@/db"
import { estradasInMonitoramento, type NewEstradaData } from "@/db/schema";

// ADR 0010: isolamento na aplicação — escopo de tenant é obrigatório e explícito.
// Falha alto em vez de cair silenciosamente num tenant padrão ou retornar dados
// de todas as Organizações.
function requireExplicitTenant(tenantId?: string | null): string {
  if (!tenantId) throw new Error("tenantId é obrigatório (ADR 0010): a rota deve resolver o escopo via resolveScope/requireAuthWithTenant.");
  return tenantId;
}



export async function findAllEstradasDataWithGeometry(tenantId?: string | null) {
  const effectiveTenantId = requireExplicitTenant(tenantId);

  const whereSql = effectiveTenantId
    ? sql`WHERE tenant_id = ${effectiveTenantId}::uuid`
    : sql``;

  const result = await db.execute(sql`
    SELECT id, nome, tipo, codigo, ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.0001), 5) as geojson
    FROM "monitoramento"."estradas"
    ${whereSql}
  `);

  return result;
}


export async function insertEstradaData(data: NewEstradaData) {
  const [newRecord] = await db
    .insert(estradasInMonitoramento)
    .values({
      nome: data.nome,
      tipo: data.tipo,
      codigo: data.codigo,
      geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4674)`,
    })
    .returning({ id: estradasInMonitoramento.id });

  return newRecord;
}