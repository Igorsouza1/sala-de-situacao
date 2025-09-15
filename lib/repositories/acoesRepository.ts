import { db } from "@/db"
import { acoes, fotosAcoes, NewAcoesData } from "@/db/schema"
import { eq, desc, sql} from "drizzle-orm";

export async function findAllAcoesData(regiaoId: number) {
  const result = await db
    .select({
      id: acoes.id,
      name: acoes.name,
      time: acoes.time,
      descricao: acoes.descricao,
      mes: acoes.mes,
      atuacao: acoes.atuacao,
      acao: acoes.acao,
    })
    .from(acoes)
    .where(eq(acoes.regiaoId, regiaoId))
    .execute()
  
  return result;
}

export async function findAllAcoesDataWithGeometry(regiaoId: number){
  const result = await db.execute(sql`
    SELECT id, acao, name, descricao, mes, time, ST_AsGeoJSON(geom) as geojson
    FROM "acoes"
    WHERE regiao_id = ${regiaoId}
  `);

  return result.rows;
}


export async function findAllAcoesImagesData(id: number) {
  const result = await db
    .select({
      id: fotosAcoes.id,
      acaoId: fotosAcoes.acaoId,
      url: fotosAcoes.url,
      created_at: fotosAcoes.createdAt,
    })
    .from(fotosAcoes)
    .where(eq(fotosAcoes.acaoId, id))
    .orderBy(desc(fotosAcoes.createdAt))
    .execute()

    return result
}

export async function deleteAcaoById(id: number) {
  const result = await db
    .delete(acoes)
    .where(eq(acoes.id, id))
    .execute()
  return result
}

export async function updateAcaoById(id: number, data: any) {
  const result = await db
    .update(acoes)
    .set(data)
    .where(eq(acoes.id, id))
    .execute()
  return result
}

export async function addAcaoImageById(acaoId: number, url: string, descricao: string) {
  const result = await db
    .insert(fotosAcoes)
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
  .insert(acoes)
  .values({
    ...data,
    geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4326)`,
  })
  .returning({ id: acoes.id });
  return newRecord
}
