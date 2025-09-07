

import { getAllAcoesData, getAllAcoesForMap, createAcoesWithTrilha } from "@/lib/service/acoesService";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { createAcoesSchema } from "@/lib/validations/acoes";
import { revalidatePath } from "next/cache";



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


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const trilhaRaw = formData.get("trilha");
    const waypointsRaw = formData.get("waypoints");

    if (typeof trilhaRaw !== "string" || typeof waypointsRaw !== "string") {
      return apiError("Dados inválidos.", 400);
    }

    const parsed = createAcoesSchema.safeParse({
      trilha: JSON.parse(trilhaRaw),
      waypoints: JSON.parse(waypointsRaw),
    });

    if (!parsed.success) {
      return apiError("Body inválido.", 400);
    }

    const filesMap: Record<string, File[]> = {};
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key.startsWith("fotos_")) {
        const tempId = key.replace("fotos_", "");
        (filesMap[tempId] ||= []).push(value);
      }
    }

    const waypoints = parsed.data.waypoints.map((wp) => ({
      ...wp,
      fotos: filesMap[wp.tempId ?? ""] || [],
    }));

    const created = await createAcoesWithTrilha({
      trilha: parsed.data.trilha,
      waypoints,
    });

    revalidatePath('/protected'); 

    return apiSuccess(created, 201);
  } catch (error) {
    console.error("Erro ao criar ações:", error);
    return apiError("Falha ao criar ações.", 500);
  }
}


