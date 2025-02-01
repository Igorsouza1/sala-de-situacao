import { NextResponse } from "next/server"
import { db, sql } from "@/db"

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const table = searchParams.get("table")

  if (!table) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  try {
    const item = await request.json()
    const primaryKey = await getPrimaryKey(table)

    if (!primaryKey) {
      return NextResponse.json({ error: "Unable to determine primary key" }, { status: 500 })
    }

    await db.execute(sql`
      DELETE FROM ${sql.identifier(table)}
      WHERE ${sql.identifier(primaryKey)} = ${item[primaryKey]}
    `)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting item from table ${table}:`, error)
    return NextResponse.json({ error: `Failed to delete item from table ${table}` }, { status: 500 })
  }
}

async function getPrimaryKey(table: string): Promise<string | null> {
  const result = await db.execute<{ attname: string }>(sql`
    SELECT a.attname
    FROM   pg_index i
    JOIN   pg_attribute a ON a.attrelid = i.indrelid
                         AND a.attnum = ANY(i.indkey)
    WHERE  i.indrelid = ${table}::regclass
    AND    i.indisprimary
  `)
    if(!Array.isArray(result)) {
        throw new Error("Nada encontrado")
    }

  return result[0]?.attname ?? null
}

