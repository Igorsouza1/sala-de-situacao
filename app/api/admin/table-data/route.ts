import { NextResponse } from "next/server"
import { db, sql } from "@/db"

interface QueryResult {
  command: string
  rowCount: number
  oid: null
  rows: any[]
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
    const data = await db.execute<QueryResult>(sql`
      SELECT *
      FROM rio_da_prata.${sql.identifier(table)}
    `)
    return NextResponse.json(data.rows)
  } catch (error) {
    console.error(`Error fetching data from table ${table}:`, error)
    return NextResponse.json({ error: `Failed to fetch data from table ${table}` }, { status: 500 })
  }
}