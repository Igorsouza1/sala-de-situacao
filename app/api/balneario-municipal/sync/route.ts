import { apiError, apiSuccess } from "@/lib/api/responses"
import { syncBalnearioFromSheet } from "@/lib/service/sheetSyncService"

export async function POST() {
  const result = await syncBalnearioFromSheet()

  if (result.error) {
    return apiError(result.error, 500)
  }

  return apiSuccess(result, 200)
}
