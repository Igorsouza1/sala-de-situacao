import { apiError, apiSuccess } from "@/lib/api/responses"
import { getAllDesmatamentoDataGroupedByMonthAndYear } from "@/lib/service/desmatamentoService"



export async function GET(request: Request){
    try{
        const desmatamentoData = await getAllDesmatamentoDataGroupedByMonthAndYear()
        return apiSuccess(desmatamentoData, 200)
    }catch(error){
        return apiError(error as string, 500)
    }
}