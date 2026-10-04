import { apiError, apiSuccess } from "@/lib/api/responses";
import { createEstradaData } from "@/lib/service/estradaService";
import { ZodError } from "zod";
import { requireAuthWithTenant, requireRole } from "@/lib/api/require-auth";
import { getAccessibleRegionIdsForUser } from "@/lib/api/require-region";
import { requireWriteRegion } from "@/lib/api/require-write-region";
import { findAllEstradasData } from "@/lib/repositories/estradasRepository";

export async function GET() {
    const { user, tenantId, response } = await requireAuthWithTenant();
    if (response) return response;
    try {
        const regionIds = await getAccessibleRegionIdsForUser(user!.id, tenantId!, user?.app_metadata?.is_superadmin === true);
        return apiSuccess(await findAllEstradasData(tenantId!, user?.app_metadata?.is_superadmin === true, regionIds));
    } catch (error) {
        console.error("Erro ao consultar estradas:", error);
        return apiError("Ocorreu um erro inesperado no servidor.", 500);
    }
}


export async function POST(req: Request){
    const { user, tenantId, response } = await requireRole("editor");
    if (response) return response;
    try{
        const body = await req.json()
        const region = await requireWriteRegion(user!, tenantId!, body.regiaoId == null ? null : String(body.regiaoId));
        if (region.response) return region.response;
        const newEntry = await createEstradaData(body, region.tenantId, region.regionId)
        return apiSuccess(newEntry, 201)
    }catch(error){
        if(error instanceof ZodError){
            console.log("Erro de validação Zod:", error.issues);
            return apiError(
                error.issues.map((issue) => issue.message).join(", "),
                400
              );
        }
        console.error("Erro inesperado:", error);
        return apiError("Ocorreu um erro inesperado no servidor.", 500);
    }
 }
