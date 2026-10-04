import { requireStationAccess } from "@/lib/api/station-access"
import { apiError, apiSuccess } from "@/lib/api/responses"
import { createBalnearioData, getAllBalnearioDataGroupedByMonth } from "@/lib/service/balnearioService"
import { NextRequest } from "next/server"
import { ZodError } from "zod"

export async function GET() {
  const access = await requireStationAccess("balneario-municipal", false)
  if (access.response) return access.response

  try {
    const data = await getAllBalnearioDataGroupedByMonth(access.tenantId!)
    return apiSuccess(data)
  } catch (error) {
    return apiError(error as string, 500)
  }
}

export async function POST(req: NextRequest) {
  const access = await requireStationAccess("balneario-municipal", true)
  if (access.response) return access.response

  try {
    const body = await req.json()
    const newEntry = await createBalnearioData(access.tenantId!, body)
    return apiSuccess(newEntry, 201)
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(
        error.issues.map((issue) => issue.message).join(", "),
        400
      )
    }
    console.error("Erro inesperado:", error)
    return apiError("Ocorreu um erro inesperado no servidor.", 500)
  }
}
