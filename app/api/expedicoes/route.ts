import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllExpedicoesData } from "@/lib/service/expedicoesService";

export async function GET() {
    try {
        const expedicoesData = await getAllExpedicoesData();
        return apiSuccess(expedicoesData);
    } catch (error) {
        return apiError(error as string, 500);
    }
}