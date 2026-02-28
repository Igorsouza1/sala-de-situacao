import { NextResponse } from "next/server";
import { db } from "@/db";
import { regioesInMonitoramento } from "@/db/schema";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const regioes = await db.select({
            id: regioesInMonitoramento.id,
            nome: regioesInMonitoramento.nome
        }).from(regioesInMonitoramento).orderBy(regioesInMonitoramento.nome);

        return NextResponse.json(regioes);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Erro ao buscar regiões" },
            { status: 500 }
        );
    }
}
