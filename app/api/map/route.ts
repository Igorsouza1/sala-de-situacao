import { NextResponse } from "next/server";
import { db } from "@/db";



export async function GET() {
  try {
    // Buscar dados da tabela "estradas"
    const data = await db.query.estradasInRioDaPrata.findMany({
        columns: {
            id: true,
            nome: true,
            tipo: true,
            codigo: true
        }
    });

    return NextResponse.json({ estradas: data });
  } catch (error) {
    console.error("Error fetching estradas data:", error);
    return NextResponse.json({ error: "Failed to get estradas data" }, { status: 500 });
  }
}
