import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllMapLayersData } from "@/lib/service/mapLayerService";



export async function GET(request: Request) {
    try{
        const { searchParams } = new URL(request.url);
        const regiaoId = searchParams.get("regiaoId");

        if (!regiaoId) {
            return apiError("O parâmetro regiaoId é obrigatório.", 400);
        }

        const mapLayersData = await getAllMapLayersData(Number(regiaoId));
        return apiSuccess(mapLayersData);
    } catch (error) {
        return apiError(error as string, 500);
    }
}