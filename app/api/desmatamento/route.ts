import { apiError, apiSuccess } from "@/lib/api/responses"
import { getAllDesmatamentoDataGroupedByMonthAndYear } from "@/lib/service/desmatamentoService"



export async function GET(request: Request){
    try{
        const { searchParams } = new URL(request.url);
        const regiaoId = searchParams.get("regiaoId");

        if (!regiaoId) {
            return apiError("O parâmetro regiaoId é obrigatório.", 400);
        }

        const desmatamentoData = await getAllDesmatamentoDataGroupedByMonthAndYear(Number(regiaoId))
        return apiSuccess(desmatamentoData, 200)
    }catch(error){
        return apiError(error as string, 500)
    }
}