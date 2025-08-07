import { NextResponse } from "next/server"
import { genericRepo } from "@/lib/repo/generic-repo"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get("table")

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: "Body is required" }, { status: 400 })
    }

    if (!tableName) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    const result = await genericRepo.criar(tableName, body)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error inserting item:", error)
    return NextResponse.json({ error: "Failed to insert item" }, { status: 500 })
  }
}
