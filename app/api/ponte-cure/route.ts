import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllPonteData } from "@/lib/service/ponteService";




export async function GET(){
    try{
        const ponteData = await getAllPonteData()

        return apiSuccess(ponteData)
    }catch(error){
        return apiError(error as string, 500)
    }
}