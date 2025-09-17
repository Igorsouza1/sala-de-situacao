// lib/repositories/fogoRepository.ts

import { db } from "@/db"
import { acoesInRioDaPrata, fotosAcoesInRioDaPrata, NewAcoesData } from "@/db/schema"
import { eq, desc, sql} from "drizzle-orm";

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
    SELECT id, acao, name, descricao, mes, time, ST_AsGeoJSON(geom) as geojson
    FROM "rio_da_prata"."acoes"
  `)

    return result.rows
}


export async function findAllAcoesImagesData(id: number) {
  const result = await db
    .select({
      id: fotosAcoesInRioDaPrata.id,
      acaoId: fotosAcoesInRioDaPrata.acaoId,
      url: fotosAcoesInRioDaPrata.url,
      created_at: fotosAcoesInRioDaPrata.createdAt,
    })
    .from(fotosAcoesInRioDaPrata)
    .where(eq(fotosAcoesInRioDaPrata.acaoId, id))
    .orderBy(desc(fotosAcoesInRioDaPrata.createdAt))
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



