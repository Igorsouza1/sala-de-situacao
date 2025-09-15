import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllFirmsData } from "@/lib/service/firmsService";
import { NextRequest } from "next/server";



export async function GET(request: NextRequest) {
    try{
        const { searchParams } = new URL(request.url);
        const regiaoId = searchParams.get("regiaoId");

        if (!regiaoId) {
            return apiError("O parâmetro regiaoId é obrigatório.", 400);
        }

        const fogoData = await getAllFirmsData(Number(regiaoId))

        return apiSuccess(fogoData)
    }catch(error){
        return apiError(error as string, 500)
    }

}