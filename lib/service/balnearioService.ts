import { findAllBalnearioData, findBalnearioDataByDateRange, insertBalnearioData } from "../repositories/balnearioRepository"
import { createBalnearioSchema } from "../validations/balneario"
import Zod from "zod"

interface MonthData {
  pluviometria: number
  turbidez: number[]
  turbidezMax?: number
  turbidezMin?: number
  turbidezMedia?: number
  nivelAgua: number[]
  nivelAguaMedia?: number
}

export async function getAllBalnearioDataGroupedByMonth() {
  const data = await findAllBalnearioData()

  const groupedData = data.reduce(
    (acc, item) => {
      if (item.data) {
        const date = new Date(item.data)
        const year = date.getFullYear()
        const month = date.getMonth()

        if (!acc[year]) {
          acc[year] = Array(12)
            .fill(null)
            .map(() => ({ pluviometria: 0, turbidez: [], nivelAgua: [] }))
        }

        acc[year][month].pluviometria += Number(item.pluviometria) || 0

        if (item.turbidez !== null && item.turbidez !== undefined) {
          acc[year][month].turbidez.push(Number(item.turbidez))
        }

        if (item.nivelAgua !== null && item.nivelAgua !== undefined) {
          acc[year][month].nivelAgua.push(Number(item.nivelAgua))
        }
      }

      return acc
    },
    {} as Record<number, MonthData[]>,
  )

  Object.values(groupedData).forEach((yearData) => {
    yearData.forEach((monthData) => {
      if (monthData.turbidez.length > 0) {
        monthData.turbidezMax = Math.max(...monthData.turbidez)
        monthData.turbidezMin = Math.min(...monthData.turbidez)
        monthData.turbidezMedia =
          monthData.turbidez.reduce((sum, val) => sum + val, 0) / monthData.turbidez.length
      }

      if (monthData.nivelAgua.length > 0) {
        monthData.nivelAguaMedia =
          monthData.nivelAgua.reduce((sum, val) => sum + val, 0) / monthData.nivelAgua.length
      }
    })
  })

  return groupedData
}

export async function getBalnearioDataByDateRange(startDate: string, endDate: string) {
  return findBalnearioDataByDateRange(startDate, endDate)
}

type BalnearioInput = Zod.infer<typeof createBalnearioSchema>;

export async function createBalnearioData(input: BalnearioInput) {
  const validatedData = createBalnearioSchema.parse(input)

  const mes = validatedData.data.toLocaleString("pt-BR", { month: "long" })

  const completeData = {
    data: validatedData.data.toISOString().split("T")[0],
    local: "Balneário Municipal",
    mes,
    turbidez: validatedData.turbidez != null ? validatedData.turbidez.toString() : null,
    secchiVertical: validatedData.secchiVertical != null ? validatedData.secchiVertical.toString() : null,
    nivelAgua: validatedData.nivelAgua != null ? validatedData.nivelAgua.toString() : null,
    pluviometria: validatedData.pluviometria != null ? validatedData.pluviometria.toString() : null,
    observacao: validatedData.observacao ?? null,
  }

  return insertBalnearioData(completeData)
}

const fmt = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

const toNum = (v: any) => (v == null ? NaN : Number(v))

function mtdRange(today: Date) {
  const year = today.getFullYear()
  const month0 = today.getMonth()
  const day = today.getDate()
  const lastYear = year - 1
  const startThis = new Date(year, month0, 1)
  const startLast = new Date(lastYear, month0, 1)
  const endLast = new Date(lastYear, month0, Math.min(day, new Date(lastYear, month0 + 1, 0).getDate()))
  return { startThis, startLast, endLast }
}

function mean(rows: any[], field: string) {
  const vals = rows.map((r) => toNum(r[field])).filter((v) => Number.isFinite(v))
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

export async function getNivelAguaBalnearioIndicador() {
  const today = new Date()
  const { startThis, startLast, endLast } = mtdRange(today)

  const [rowsAtual, rowsPassado] = await Promise.all([
    findBalnearioDataByDateRange(fmt(startThis), fmt(today)),
    findBalnearioDataByDateRange(fmt(startLast), fmt(endLast)),
  ])

  const validAtual = rowsAtual
    .filter((r) => Number.isFinite(toNum(r.nivelAgua)))
    .sort((a, b) => new Date(a.data!).getTime() - new Date(b.data!).getTime())

  const validPassado = rowsPassado.filter((r) => Number.isFinite(toNum(r.nivelAgua)))
  const lastRow = validAtual.length ? validAtual[validAtual.length - 1] : null

  const current = lastRow ? toNum(lastRow.nivelAgua) : null
  const mtdAtual = mean(validAtual, "nivelAgua")
  const mtdPassado = mean(validPassado, "nivelAgua")
  const deltaPct =
    mtdAtual !== null && mtdPassado !== null && mtdPassado !== 0
      ? ((mtdAtual - mtdPassado) / mtdPassado) * 100
      : null

  return { current, mtdAtual, mtdPassado, deltaPct, lastDate: lastRow?.data ?? null }
}

export async function getPluviometriaBalnearioIndicador() {
  const today = new Date()
  const { startThis, startLast, endLast } = mtdRange(today)

  const [rowsAtual, rowsPassado] = await Promise.all([
    findBalnearioDataByDateRange(fmt(startThis), fmt(today)),
    findBalnearioDataByDateRange(fmt(startLast), fmt(endLast)),
  ])

  const validAtual = rowsAtual
    .filter((r) => Number.isFinite(toNum(r.pluviometria)))
    .sort((a, b) => new Date(a.data!).getTime() - new Date(b.data!).getTime())

  const validPassado = rowsPassado.filter((r) => Number.isFinite(toNum(r.pluviometria)))
  const lastRow = validAtual.length ? validAtual[validAtual.length - 1] : null

  const mtdAtual = mean(validAtual, "pluviometria")
  const mtdPassado = mean(validPassado, "pluviometria")
  const deltaPct =
    mtdAtual !== null && mtdPassado !== null && mtdPassado !== 0
      ? ((mtdAtual - mtdPassado) / mtdPassado) * 100
      : null

  return { mtdAtual, mtdPassado, deltaPct, lastDate: lastRow?.data ?? null }
}

export async function getSecchiBalnearioIndicador() {
  const today = new Date()
  const { startThis, startLast, endLast } = mtdRange(today)
  const start30 = new Date(today.getTime() - 30 * 86400000)

  const [rowsRecent, rowsAtual, rowsPassado] = await Promise.all([
    findBalnearioDataByDateRange(fmt(start30), fmt(today)),
    findBalnearioDataByDateRange(fmt(startThis), fmt(today)),
    findBalnearioDataByDateRange(fmt(startLast), fmt(endLast)),
  ])

  const byDate = (a: any, b: any) => new Date(a.data!).getTime() - new Date(b.data!).getTime()
  const validRecent = rowsRecent.filter((r) => Number.isFinite(toNum(r.secchiVertical))).sort(byDate)
  const lastRow = validRecent.length ? validRecent[validRecent.length - 1] : null

  const current = lastRow ? toNum(lastRow.secchiVertical) : null
  const mtdAtual = mean(rowsAtual.filter((r) => Number.isFinite(toNum(r.secchiVertical))), "secchiVertical")
  const mtdPassado = mean(rowsPassado.filter((r) => Number.isFinite(toNum(r.secchiVertical))), "secchiVertical")
  const deltaPct =
    mtdAtual !== null && mtdPassado !== null && mtdPassado !== 0
      ? ((mtdAtual - mtdPassado) / mtdPassado) * 100
      : null

  return { current, mtdAtual, mtdPassado, deltaPct, lastDate: lastRow?.data ?? null }
}

export async function getSecchiBalnearioHistorico() {
  const data = await findAllBalnearioData()

  const byMonth: Record<string, number[]> = {}

  for (const row of data) {
    if (!row.data || row.secchiVertical == null) continue
    const d = new Date(row.data)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const v = Number(row.secchiVertical)
    if (Number.isFinite(v) && v > 0) {
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(v)
    }
  }

  const result: { periodo: string; secchi: number | null }[] = []
  const now = new Date()
  let y = 2024
  let m = 1

  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
    const key = `${y}-${String(m).padStart(2, "0")}`
    const vals = byMonth[key] ?? []
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    result.push({ periodo: key, secchi: avg !== null ? Math.round(avg * 100) / 100 : null })
    m++
    if (m > 12) { m = 1; y++ }
  }

  return result
}

export async function getPluviometriaBalnearioHistorico() {
  const data = await findAllBalnearioData()

  const byMonth: Record<string, number> = {}

  for (const row of data) {
    if (!row.data || row.pluviometria == null) continue
    const d = new Date(row.data)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const v = Number(row.pluviometria)
    if (Number.isFinite(v)) {
      byMonth[key] = (byMonth[key] ?? 0) + v
    }
  }

  const result: { periodo: string; pluviometria: number }[] = []
  const now = new Date()
  let y = 2024
  let m = 1

  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
    const key = `${y}-${String(m).padStart(2, "0")}`
    result.push({ periodo: key, pluviometria: Math.round((byMonth[key] ?? 0) * 10) / 10 })
    m++
    if (m > 12) { m = 1; y++ }
  }

  return result
}

export async function getNivelRioBalnearioHistorico() {
  const data = await findAllBalnearioData()

  const byMonth: Record<string, number[]> = {}

  for (const row of data) {
    if (!row.data || row.nivelAgua == null) continue
    const d = new Date(row.data)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const v = Number(row.nivelAgua)
    if (Number.isFinite(v)) {
      if (!byMonth[key]) byMonth[key] = []
      byMonth[key].push(v)
    }
  }

  const result: { periodo: string; nivelAgua: number | null }[] = []
  const now = new Date()
  let y = 2024
  let m = 1

  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
    const key = `${y}-${String(m).padStart(2, "0")}`
    const vals = byMonth[key] ?? []
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    result.push({ periodo: key, nivelAgua: avg !== null ? Math.round(avg * 100) / 100 : null })
    m++
    if (m > 12) { m = 1; y++ }
  }

  return result
}
