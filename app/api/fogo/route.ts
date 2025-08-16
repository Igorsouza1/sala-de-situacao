import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllFirmsData } from "@/lib/service/firmsService";



export async function GET() {
    try{
        const fogoData = await getAllFirmsData()

        return apiSuccess(fogoData)
    }catch(error){
        return apiError(error as string, 500)
    }

}