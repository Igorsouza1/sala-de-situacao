// lib/repositories/fogoRepository.ts

import { db } from "@/db"
import { acoesInRioDaPrata, fotosAcoesInRioDaPrata, NewAcoesData } from "@/db/schema"
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

export async function findAllAcoesData() {
  const result = await db
    .select({
      id: acoesInRioDaPrata.id,
      name: acoesInRioDaPrata.name,
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

export async function findAllAcoesDataWithGeometry(startDate?: Date, endDate?: Date) {
  let query = `
    SELECT a.id, a.acao, a.name, a.descricao, a.mes, a.atuacao, a.time, a.status, a.categoria, a.tipo, ST_AsGeoJSON(a.geom) as geojson,
    MAX(f.created_at) as ultima_foto_em
    FROM "monitoramento"."acoes" a
    LEFT JOIN "monitoramento"."fotos_acoes" f ON a.id = f.acao_id
  `;

  const conditions: string[] = [];

  if (startDate) {
    conditions.push(`a.time >= '${startDate.toISOString()}'`);
  }

  if (endDate) {
    conditions.push(`a.time <= '${endDate.toISOString()}'`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` GROUP BY a.id`;

  const result = await db.execute(query);

  return result.rows
}


export async function findAllAcoesUpdates(id: number) {
  const result = await db
    .select({
      id: fotosAcoesInRioDaPrata.id,
      acaoId: fotosAcoesInRioDaPrata.acaoId,
      descricao: fotosAcoesInRioDaPrata.descricao,  // <-- O comentário ou legenda
      url: fotosAcoesInRioDaPrata.url,   // <-- A URL da mídia
      timestamp: fotosAcoesInRioDaPrata.atualizacao,
      createdAt: fotosAcoesInRioDaPrata.createdAt,
    })
    .from(fotosAcoesInRioDaPrata)
    .where(eq(fotosAcoesInRioDaPrata.acaoId, id))
    .orderBy(desc(fotosAcoesInRioDaPrata.createdAt)) // Mais recente primeiro
    .execute();

  return result;
}


export async function deleteAcaoUpdateById(id: number) {
  const result = await db
    .delete(fotosAcoesInRioDaPrata)
    .where(eq(fotosAcoesInRioDaPrata.id, id))
    .execute()
  return result
}

export async function deleteAcaoById(id: number) {
  const result = await db
    .delete(acoesInRioDaPrata)
    .where(eq(acoesInRioDaPrata.id, id))
    .execute()
  return result
}

export async function updateAcaoById(id: number, data: any) {
  const result = await db
    .update(acoesInRioDaPrata)
    .set(data)
    .where(eq(acoesInRioDaPrata.id, id))
    .execute()
  return result
}

export async function addAcaoImageById(acaoId: number, url: string, descricao: string, atualizacao: Date) {
  const result = await db
    .insert(fotosAcoesInRioDaPrata)
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
    .insert(acoesInRioDaPrata)
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
    .returning({ id: acoesInRioDaPrata.id });
  return newRecord
}



