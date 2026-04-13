// lib/repositories/fogoRepository.ts

import { db } from "@/db"
import { acoesInMonitoramento, fotosAcoesInMonitoramento, NewAcoesData } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm";


export async function findAcaoById(id: number) {
  // Uses raw SQL to perform spatial JOINs
  const query = sql`
    SELECT 
      a.*,
      p.nome as propriedade,
      p.cod_imovel as "propriedadeCodigo",
      ST_AsGeoJSON(p.geom) as "propriedadeGeoJson",
      ST_AsGeoJSON(ld.geom) as "banhadoGeoJson"
    FROM "monitoramento"."acoes" a
    LEFT JOIN "monitoramento"."propriedades" p ON ST_Intersects(p.geom, a.geom)
    LEFT JOIN "monitoramento"."layer_data" ld 
      ON ld.layer_id = (SELECT id FROM "monitoramento"."layer_catalog" WHERE slug = 'banhado' LIMIT 1)
      -- Alterado de ST_Intersects para ST_DWithin
      -- Cast ::geography garante o cálculo em METROS
      AND ST_DWithin(ld.geom::geography, a.geom::geography, 5000)
    WHERE a.id = ${id}
  `;

  const result = await db.execute(query);
  return result.rows[0];
}

export async function findAllAcoesData(tenantId?: string | null) {
  const effectiveTenantId = tenantId ?? process.env.SEED_TENANT_ID;

  return db
    .select({
      id: acoesInMonitoramento.id,
      name: acoesInMonitoramento.name,
      time: acoesInMonitoramento.time,
      descricao: acoesInMonitoramento.descricao,
      mes: acoesInMonitoramento.mes,
      atuacao: acoesInMonitoramento.atuacao,
      acao: acoesInMonitoramento.acao,
    })
    .from(acoesInMonitoramento)
    .where(effectiveTenantId ? eq(acoesInMonitoramento.tenantId, effectiveTenantId) : undefined);
}

export async function findAllAcoesDataWithGeometry(tenantId?: string | null, startDate?: Date, endDate?: Date) {
  const effectiveTenantId = tenantId ?? process.env.SEED_TENANT_ID;

  const conditions: ReturnType<typeof sql>[] = [];

  if (effectiveTenantId) {
    conditions.push(sql`a.tenant_id = ${effectiveTenantId}::uuid`);
  }
  if (startDate) {
    conditions.push(sql`a.time >= ${startDate.toISOString()}::timestamp`);
  }
  if (endDate) {
    conditions.push(sql`a.time <= ${endDate.toISOString()}::timestamp`);
  }

  const whereSql = conditions.length > 0
    ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
    : sql``;

  const result = await db.execute(sql`
    SELECT a.id, a.acao, a.name, a.descricao, a.mes, a.atuacao, a.time,
    TO_CHAR(a.time, 'DD/MM/YYYY HH24:MI') as time_formatado,
    a.status, a.categoria, a.tipo, a.eixo_tematico, a.tipo_tecnico, a.carater,
    ST_AsGeoJSON(a.geom) as geojson,
    MAX(f.created_at) as ultima_foto_em
    FROM "monitoramento"."acoes" a
    LEFT JOIN "monitoramento"."fotos_acoes" f ON a.id = f.acao_id
    ${whereSql}
    GROUP BY a.id
  `);

  return result.rows;
}


export async function findAllAcoesUpdates(id: number) {
  const result = await db
    .select({
      id: fotosAcoesInMonitoramento.id,
      acaoId: fotosAcoesInMonitoramento.acaoId,
      descricao: fotosAcoesInMonitoramento.descricao,  // <-- O comentário ou legenda
      url: fotosAcoesInMonitoramento.url,   // <-- A URL da mídia
      timestamp: fotosAcoesInMonitoramento.atualizacao,
      createdAt: fotosAcoesInMonitoramento.createdAt,
    })
    .from(fotosAcoesInMonitoramento)
    .where(eq(fotosAcoesInMonitoramento.acaoId, id))
    .orderBy(desc(fotosAcoesInMonitoramento.createdAt)) // Mais recente primeiro
    .execute();

  return result;
}


export async function deleteAcaoUpdateById(id: number) {
  const result = await db
    .delete(fotosAcoesInMonitoramento)
    .where(eq(fotosAcoesInMonitoramento.id, id))
    .execute()
  return result
}

export async function deleteAcaoById(id: number) {
  const result = await db
    .delete(acoesInMonitoramento)
    .where(eq(acoesInMonitoramento.id, id))
    .execute()
  return result
}

export async function updateAcaoById(id: number, data: any) {
  const result = await db
    .update(acoesInMonitoramento)
    .set(data)
    .where(eq(acoesInMonitoramento.id, id))
    .execute()
  return result
}

export async function addAcaoImageById(acaoId: number, url: string, descricao: string, atualizacao: Date) {
  const result = await db
    .insert(fotosAcoesInMonitoramento)
    .values({
      acaoId,
      url,
      descricao,
      createdAt: new Date().toISOString(),
      atualizacao: atualizacao.toISOString(),
    })
    .execute()

  return result
}


export async function insertAcaoData(data: NewAcoesData) {
  const [newRecord] = await db
    .insert(acoesInMonitoramento)
    .values({
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      elevation: data.elevation,
      time: data.time,
      descricao: data.descricao,
      mes: data.mes,
      atuacao: data.atuacao,
      acao: data.acao,

      geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4674)`,
    })
    .returning({ id: acoesInMonitoramento.id });
  return newRecord
}



