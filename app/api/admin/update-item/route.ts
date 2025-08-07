import { NextResponse } from "next/server"
import { genericRepo } from "@/lib/repo/generic-repo"

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

    if (!body.id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const result = await genericRepo.atualizar(tableName, body.id, body)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}
