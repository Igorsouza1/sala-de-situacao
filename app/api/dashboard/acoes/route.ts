import { NextResponse } from "next/server"

import { getAllAcoesData } from "@/lib/service/acoesService";

export async function GET() {
  try {
    const result = await getAllAcoesData();
    return NextResponse.json(result);
  } catch (error) {
    
    console.error("Erro ao buscar dados de Ações:", error);
    return NextResponse.json({ error: "Falha ao obter os dados de Ações" }, { status: 500 });
  }
}


