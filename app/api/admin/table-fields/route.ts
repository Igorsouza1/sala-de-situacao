import { NextResponse } from "next/server"
import { genericRepo } from "@/lib/repo/generic-repo"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const table = searchParams.get("table")

  if (!table) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  try {
    const fields = await genericRepo.listarCampos(table)
    return NextResponse.json(fields)
  } catch (error) {
    console.error(`Error fetching fields for table ${table}:`, error)
    return NextResponse.json({ error: `Failed to fetch fields for table ${table}` }, { status: 500 })
  }
}
