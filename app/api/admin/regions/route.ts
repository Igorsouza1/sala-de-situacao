import { apiError, apiSuccess } from "@/lib/api/responses";
import { createRegion, listRegions } from "@/lib/service/adminService";
import { regionPayloadSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    const data = await listRegions();
    return apiSuccess(data);
  } catch (error) {
    console.error("admin regions GET failed", error);
    return apiError("Falha ao listar regiões.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    if (!json) {
      return apiError("Body JSON é obrigatório.", 400);
    }

    const parsed = regionPayloadSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("Body inválido.", 400);
    }

    const created = await createRegion(parsed.data);
    return apiSuccess(created, 201);
  } catch (error) {
    console.error("admin regions POST failed", error);
    return apiError("Falha ao criar região.", 500);
  }
}
