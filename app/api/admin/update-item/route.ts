import { NextResponse } from "next/server"
import { db } from "@/db"
import { sql } from "drizzle-orm"
import * as schema from "@/db/schema"

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get("table")


    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: "Body is required and cannot be empty" }, { status: 400 })
    }

    if (!tableName) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    const table = schema[tableName as keyof typeof schema]
    if (!table) {
      return NextResponse.json({ error: "Invalid table name" }, { status: 400 })
    }

    if (!body.id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    // Criando dinamicamente os campos a serem atualizados
    const updates = Object.entries(body)
      .filter(([key]) => key !== "id") // Exclui o ID da atualização
      .map(([key, value]) => sql`${sql.identifier(key)} = ${value}`)

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }


    // Executando a query de UPDATE dinâmica
    const result = await db.execute(sql`
      UPDATE rio_da_prata.${table}
      SET ${sql.join(updates, sql`, `)}
      WHERE id = ${body.id}
    `)

    return NextResponse.json({ success: true, updatedRows: result.rowCount })
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}
