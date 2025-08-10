

import { getAllAcoesData, getAllAcoesForMap } from "@/lib/service/acoesService";
import { apiError, apiSuccess } from "@/lib/api/responses";



export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if(view === "dashboard"){
        const result = await getAllAcoesData();
        return apiSuccess(result);
    }

    if(view === "map"){
        const result = await getAllAcoesForMap();
        return apiSuccess(result);
    }

    return apiError("Visualização não especificada ou inválida.", 400);

  } catch (error) {
    
    console.error("Erro ao buscar dados de Ações:", error);
    return apiError("Falha ao obter os dados de Ações.", 500);
  }
}


