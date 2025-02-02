import { NextResponse } from "next/server"
import { db, sql } from "@/db"

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const tableName = searchParams.get("table")
  const body = await request.json()


  if (!tableName) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  try {
    const id = body.id

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const result = await db.execute(sql`
      DELETE FROM rio_da_prata.${sql.identifier(tableName)}
      WHERE id = ${body.id}
    `)

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting item from table ${tableName}:`, error)
    return NextResponse.json({ error: `Failed to delete item from table ${tableName}` }, { status: 500 })
  }
}


