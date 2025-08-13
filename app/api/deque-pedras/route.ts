import { apiError, apiSuccess } from "@/lib/api/responses"
import {  getAllDequeDataGroupedByMonth } from "@/lib/service/dequeService"



export async function GET() {
    try{
        const dequeData = await getAllDequeDataGroupedByMonth()

        return apiSuccess(dequeData)
    } catch (error) {
        return apiError(error as string, 500)
    }
    
}