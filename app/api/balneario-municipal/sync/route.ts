import { requireStationAccess } from "@/lib/api/station-access"
import { apiError, apiSuccess } from "@/lib/api/responses"
import { syncBalnearioFromSheet } from "@/lib/service/sheetSyncService"

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const isCron = !!cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`
  if (!isCron) {
    const access = await requireStationAccess("balneario-municipal", true)
    if (access.response) return access.response
  }
  const result = await syncBalnearioFromSheet()

  if (result.error) {
    return apiError(result.error, 500)
  }

  return apiSuccess(result, 200)
}
