// lib/repositories/fogoRepository.ts

import { db } from "@/db"
import { acoesInRioDaPrata, fotosAcoesInRioDaPrata, NewAcoesData } from "@/db/schema"
import { eq, desc, sql} from "drizzle-orm";


export async function findAcaoById(id: number) {
  const result = await db
    .select() // Pega todas as colunas da ação principal
    .from(acoesInRioDaPrata)
    .where(eq(acoesInRioDaPrata.id, id))
    .execute();
  return result[0]; // Retorna apenas o primeiro (ou undefined)
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

export async function findAllAcoesDataWithGeometry(){

  const result = await db.execute(`
    SELECT id, acao, name, descricao, mes, time, status, ST_AsGeoJSON(geom) as geojson
    FROM "rio_da_prata"."acoes"
  `)

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


export async function deleteAcaoUpdateById(id: number){
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

export async function addAcaoImageById(acaoId: number, url: string, descricao: string) {
  const result = await db
    .insert(fotosAcoesInRioDaPrata)
    .values({
      acaoId,
      url,
      descricao,
      createdAt: new Date().toISOString(),
    })
    .execute()

  return result
}


export async function insertAcaoData(data: NewAcoesData){
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
    geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4326)`,
  })
  .returning({ id: acoesInRioDaPrata.id });
  return newRecord
}



