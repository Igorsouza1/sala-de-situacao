import { db, sql } from "@/db"
import { criarRepositorio } from "./base-repo"

// Interface para operações genéricas
export interface GenericRepo {
  listarTabelas(): Promise<string[]>
  listarCampos(tabela: string): Promise<string[]>
  listarDados(tabela: string): Promise<any[]>
  buscarPorId(tabela: string, id: number): Promise<any | null>
  criar(tabela: string, data: any): Promise<any>
  atualizar(tabela: string, id: number, data: any): Promise<any>
  remover(tabela: string, id: number): Promise<boolean>
}

// Implementação do repositório genérico
export class GenericRepository implements GenericRepo {
  async listarTabelas(): Promise<string[]> {
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'rio_da_prata'
    `)
    return result.rows.map((row: any) => row.table_name)
  }

  async listarCampos(tabela: string): Promise<string[]> {
    const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'rio_da_prata'
        AND table_name = ${tabela}
    `)
    return result.rows.map((row: any) => row.column_name)
  }

  async listarDados(tabela: string): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT * FROM rio_da_prata.${sql.identifier(tabela)}
    `)
    return result.rows
  }

  async buscarPorId(tabela: string, id: number): Promise<any | null> {
    const result = await db.execute(sql`
      SELECT * FROM rio_da_prata.${sql.identifier(tabela)}
      WHERE id = ${id}
    `)
    return result.rows[0] || null
  }

  async criar(tabela: string, data: any): Promise<any> {
    const { latitude, longitude, ...restData } = data
    const keys = Object.keys(restData).map(key => sql.identifier(key))
    const values = Object.values(restData).map(value => sql`${value}`)

    // Adiciona geometria se latitude e longitude estiverem presentes
    if (latitude && longitude) {
      keys.push(sql.identifier("geom"))
      values.push(sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`)
    }

    const result = await db.execute(sql`
      INSERT INTO rio_da_prata.${sql.identifier(tabela)} (${sql.join(keys, sql`, `)})
      VALUES (${sql.join(values, sql`, `)})
      RETURNING *
    `)
    return result.rows[0]
  }

  async atualizar(tabela: string, id: number, data: any): Promise<any> {
    const updates = Object.entries(data)
      .filter(([key]) => key !== "id")
      .map(([key, value]) => sql`${sql.identifier(key)} = ${value}`)

    const result = await db.execute(sql`
      UPDATE rio_da_prata.${sql.identifier(tabela)}
      SET ${sql.join(updates, sql`, `)}
      WHERE id = ${id}
      RETURNING *
    `)
    return result.rows[0]
  }

  async remover(tabela: string, id: number): Promise<boolean> {
    const result = await db.execute(sql`
      DELETE FROM rio_da_prata.${sql.identifier(tabela)}
      WHERE id = ${id}
    `)
    if(result.rowCount) {
    return result.rowCount > 0 
  }
  return false
 }

}

// Instância singleton do repositório genérico
export const genericRepo = new GenericRepository()
