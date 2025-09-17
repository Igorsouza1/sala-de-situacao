import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllMapLayersData } from "@/lib/service/mapLayerService";



export async function GET() {
    try{
        const mapLayersData = await getAllMapLayersData();
        return apiSuccess(mapLayersData);
    } catch (error) {
        return apiError(error as string, 500);
    }
}