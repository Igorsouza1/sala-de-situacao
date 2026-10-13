import { countJavaliAvistamentos, findJavaliAvistamentosByDateRange } from "../repositories/javaliRepository"

export async function getJavaliIndicador() {
  const today = new Date()
  const year = today.getFullYear()
  const month0 = today.getMonth()

  const fmt = (d: Date) => d.toISOString().split("T")[0]

  const startThisMonth = new Date(year, month0, 1)
  const startLastMonth = new Date(year, month0 - 1, 1)
  const startSixMonths = new Date(year, month0 - 5, 1)

  const [total, rowsRecentes] = await Promise.all([
    countJavaliAvistamentos(),
    findJavaliAvistamentosByDateRange(fmt(startSixMonths), fmt(today)),
  ])

  const thisMonth = rowsRecentes.filter((row) => row.createdAt && row.createdAt >= fmt(startThisMonth)).length
  const lastMonth = rowsRecentes.filter((row) => row.createdAt && row.createdAt >= fmt(startLastMonth) && row.createdAt < fmt(startThisMonth)).length
  const deltaPct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null

  // Sparkline: monthly count for last 6 months
  const sparkMap = new Map<string, number>()
  for (const row of rowsRecentes) {
    if (row.createdAt) {
      const d = new Date(row.createdAt)
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
      sparkMap.set(key, (sparkMap.get(key) ?? 0) + 1)
    }
  }

  const sparkline: number[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month0 - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    sparkline.push(sparkMap.get(key) ?? 0)
  }

  return { total, thisMonth, lastMonth, deltaPct, sparkline }
}
