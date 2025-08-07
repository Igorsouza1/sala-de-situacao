import { NextResponse } from "next/server"
import { genericRepo } from "@/lib/repo/generic-repo"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const table = searchParams.get("table")

  if (!table) {
    return NextResponse.json({ error: "Table name is required" }, { status: 400 })
  }

  try {
    const data = await genericRepo.listarDados(table)
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error fetching data from table ${table}:`, error)
    return NextResponse.json({ error: `Failed to fetch data from table ${table}` }, { status: 500 })
  }
}