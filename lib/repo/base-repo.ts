import { db, sql } from "@/db"
import { PgTable } from "drizzle-orm/pg-core"

// Interface para operações básicas de CRUD
export interface BaseRepo<T> {
  listar(): Promise<T[]>
  buscarPorId(id: number): Promise<T | null>
  criar(data: Partial<T>): Promise<T>
  atualizar(id: number, data: Partial<T>): Promise<T>
  remover(id: number): Promise<boolean>
}

// Classe base para repositórios
export class BaseRepository<T> implements BaseRepo<T> {
  constructor(
    private table: PgTable,
    private tableName: string
  ) {}

  async listar(): Promise<T[]> {
    const result = await db.execute(sql`
      SELECT * FROM rio_da_prata.${sql.identifier(this.tableName)}
    `)
    return result.rows as T[]
  }

  async buscarPorId(id: number): Promise<T | null> {
    const result = await db.execute(sql`
      SELECT * FROM rio_da_prata.${sql.identifier(this.tableName)}
      WHERE id = ${id}
    `)
    return result.rows[0] as T || null
  }

  async criar(data: Partial<T>): Promise<T> {
    const keys = Object.keys(data).map(key => sql.identifier(key))
    const values = Object.values(data).map(value => sql`${value}`)

    const result = await db.execute(sql`
      INSERT INTO rio_da_prata.${sql.identifier(this.tableName)} (${sql.join(keys, sql`, `)})
      VALUES (${sql.join(values, sql`, `)})
      RETURNING *
    `)
    return result.rows[0] as T
  }

  async atualizar(id: number, data: Partial<T>): Promise<T> {
    const updates = Object.entries(data)
      .filter(([key]) => key !== "id")
      .map(([key, value]) => sql`${sql.identifier(key)} = ${value}`)

    const result = await db.execute(sql`
      UPDATE rio_da_prata.${sql.identifier(this.tableName)}
      SET ${sql.join(updates, sql`, `)}
      WHERE id = ${id}
      RETURNING *
    `)
    return result.rows[0] as T
  }

  async remover(id: number): Promise<boolean> {
    const result = await db.execute(sql`
      DELETE FROM rio_da_prata.${sql.identifier(this.tableName)}
      WHERE id = ${id}
    `)
    return result.rowCount ? result.rowCount > 0 : false
  }

  // Métodos específicos para operações com geometria
  async criarComGeometria(data: Partial<T> & { latitude?: number; longitude?: number }): Promise<T> {
    const { latitude, longitude, ...restData } = data
    const keys = Object.keys(restData).map(key => sql.identifier(key))
    const values = Object.values(restData).map(value => sql`${value}`)

    // Adiciona geometria se latitude e longitude estiverem presentes
    if (latitude && longitude) {
      keys.push(sql.identifier("geom"))
      values.push(sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`)
    }

    const result = await db.execute(sql`
      INSERT INTO rio_da_prata.${sql.identifier(this.tableName)} (${sql.join(keys, sql`, `)})
      VALUES (${sql.join(values, sql`, `)})
      RETURNING *
    `)
    return result.rows[0] as T
  }

  // Método para buscar com filtros
  async buscarComFiltros(filtros: Record<string, any>): Promise<T[]> {
    const conditions = Object.entries(filtros).map(([key, value]) => 
      sql`${sql.identifier(key)} = ${value}`
    )

    const result = await db.execute(sql`
      SELECT * FROM rio_da_prata.${sql.identifier(this.tableName)}
      WHERE ${sql.join(conditions, sql` AND `)}
    `)
    return result.rows as T[]
  }
}

// Função helper para criar repositórios específicos
export function criarRepositorio<T>(table: PgTable, tableName: string): BaseRepository<T> {
  return new BaseRepository<T>(table, tableName)
}
