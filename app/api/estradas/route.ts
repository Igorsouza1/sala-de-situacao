import { apiError, apiSuccess } from "@/lib/api/responses";
import { createEstradaData } from "@/lib/service/estradaService";
import { ZodError } from "zod";
import { requireAuthWithTenant, requireRole } from "@/lib/api/require-auth";
import { getRegionIdForUser } from "@/lib/api/require-region";
import { findAllEstradasData } from "@/lib/repositories/estradasRepository";

export async function GET() {
    const { user, tenantId, response } = await requireAuthWithTenant();
    if (response) return response;
    try {
        return apiSuccess(await findAllEstradasData(tenantId!, user?.app_metadata?.is_superadmin === true));
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
        const regiaoId = await getRegionIdForUser(user!.id, tenantId!);
        const newEntry = await createEstradaData(body, tenantId!, regiaoId)
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
