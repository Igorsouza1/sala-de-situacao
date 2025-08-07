import { NextResponse } from "next/server"
import { genericRepo } from "@/lib/repo/generic-repo"

export async function GET() {
  try {
    const tables = await genericRepo.listarTabelas()
    return NextResponse.json(tables)
  } catch (error) {
    console.error("Error fetching tables:", error)
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 })
  }
}

