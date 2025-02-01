import { NextResponse } from "next/server"
import { db } from "@/db"
import { eq, sql } from "drizzle-orm"
import * as schema from "@/db/schema"

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url)
  const tableName = searchParams.get("table")

  if (!tableName) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  try {
    const item = await request.json()
    const table = schema[tableName as keyof typeof schema]
    console.log(table)

    if (!table) {
      return NextResponse.json({ error: "Invalid table name" }, { status: 400 })
    }

    const { id, ...updateData } = item

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    // Process date and timestamp fields
    for (const [key, value] of Object.entries(updateData)) {
      const column = (table as any).columns?.[key]
      if (column?.dataType === "date" || column?.dataType === "timestamp") {
        updateData[key] = sql`${value}::timestamp`
      }
    }

    const result = await db
      .update(table)
      .set(updateData)
      .where(eq((table as any).columns.id, id))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, updatedItem: result[0] })
  } catch (error) {
    console.error(`Error updating item in table ${tableName}:`, error)
    return NextResponse.json({ error: `Failed to update item in table ${tableName}` }, { status: 500 })
  }
}

