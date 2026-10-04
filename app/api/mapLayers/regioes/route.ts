import { getRegionIdsForUser } from "@/lib/api/require-region";
import { resolveScope } from "@/lib/api/scope";
import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { regioesInMonitoramento } from "@/db/schema";

export const dynamic = 'force-dynamic';

export async function GET() {
    const scope = await resolveScope();
    if (scope.response) return scope.response;
    try {
        const isSuperadmin = scope.user.app_metadata?.is_superadmin === true;
        const owner = isSuperadmin ? true : (await db.execute<{ ok: boolean }>(sql`
            SELECT EXISTS (SELECT 1 FROM monitoramento.roles
            WHERE user_id = ${scope.user.id}::uuid AND tenant_id = ${scope.tenantId}::uuid
            AND role = 'owner') AS ok
        `)).rows[0]?.ok === true;
        const regionIds = owner ? [] : await getRegionIdsForUser(scope.user.id, scope.tenantId);
        if (!owner && !regionIds.length) return NextResponse.json([]);

        const regioes = await db.select({
            id: regioesInMonitoramento.id,
            nome: regioesInMonitoramento.nome
        }).from(regioesInMonitoramento).where(isSuperadmin ? undefined : and(eq(regioesInMonitoramento.organizationId, scope.tenantId), owner ? undefined : inArray(regioesInMonitoramento.id, regionIds))).orderBy(regioesInMonitoramento.nome);

        return NextResponse.json(regioes);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Erro ao buscar regiões" },
            { status: 500 }
        );
    }
}
