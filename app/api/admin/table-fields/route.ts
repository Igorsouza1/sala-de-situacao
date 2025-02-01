import { NextResponse } from "next/server"
import { db, sql } from "@/db"

interface ColumnResult {
  command: string
  rowCount: number
  oid: null
  rows: Array<{ column_name: string }>
  fields: Array<{
    name: string
    tableID: number
    columnID: number
    dataTypeID: number
    dataTypeSize: number
    dataTypeModifier: number
    format: string
  }>
  [key: string]: unknown;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const table = searchParams.get("table")

  if (!table) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  try {
    const result = await db.execute<ColumnResult>(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'rio_da_prata'
        AND table_name = ${table}
    `)

    if (!Array.isArray(result.rows)) {
      throw new Error("Unexpected result structure")
    }

    const fields = result.rows.map(row => row.column_name)
    return NextResponse.json(fields)
  } catch (error) {
    console.error(`Error fetching fields for table ${table}:`, error)
    return NextResponse.json({ error: `Failed to fetch fields for table ${table}` }, { status: 500 })
  }
}
