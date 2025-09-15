import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllExpedicoesData } from "@/lib/service/expedicoesService";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const regiaoId = searchParams.get("regiaoId");

        if (!regiaoId) {
            return apiError("O parâmetro regiaoId é obrigatório.", 400);
        }

        const expedicoesData = await getAllExpedicoesData(Number(regiaoId));
        return apiSuccess(expedicoesData);
    } catch (error) {
        return apiError(error as string, 500);
    }
}