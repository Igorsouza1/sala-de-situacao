import { upsertBalnearioDataBatch, type UpsertResult } from "../repositories/balnearioRepository"

const SHEET_ID = "1zZvvaEB_CGLH6QgUBsV-CnjzxWS_JII3"

function csvUrl(year: number) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${year}`
}

function parseDecimal(value: string): string | null {
  const cleaned = value.trim().replace(",", ".")
  const num = parseFloat(cleaned)
  return isFinite(num) ? num.toString() : null
}

// DD/MM/YYYY → YYYY-MM-DD
function parseDate(value: string): string | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

function deriveMes(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, 1).toLocaleString("pt-BR", { month: "long" })
}

function parseCSV(raw: string): string[][] {
  const lines = raw.trim().split("\n")
  return lines.map((line) => {
    const cells: string[] = []
    let current = ""
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === "," && !inQuotes) {
        cells.push(current)
        current = ""
      } else {
        current += ch
      }
    }
    cells.push(current)
    return cells
  })
}

async function fetchAndParseYear(year: number, tenantId: string) {
  const res = await fetch(csvUrl(year), { cache: "no-store" })
  if (!res.ok) return []

  const text = await res.text()
  // Se a planilha retornar HTML (ex: aba não existe), ignora
  if (text.trim().startsWith("<")) return []

  const rows = parseCSV(text)
  if (rows.length < 2) return []

  // Cabeçalho: Pontos de Monitoramento, Data, Turbidez,
  //            Disco de Secchi Vertical M, Nível da agua CM, Pluviometria, Observação
  const [, ...dataRows] = rows

  const records = []
  for (const row of dataRows) {
    const rawDate = row[1]?.trim() ?? ""
    const isoDate = parseDate(rawDate)
    if (!isoDate) continue

    // Mapeamento real do CSV (verificado via export direto da planilha):
    // col[2] = "Turbidez Disco de Secchi Vertical M" → secchi_vertical (sem turbidez separado na planilha)
    // col[3] = "Nível da agua CM"                    → nivel_agua
    // col[4] = "Pluviometria"                        → pluviometria
    // col[5] = "Observação"                          → observacao
    // turbidez fica null (não existe coluna correspondente na planilha)
    const secchiVertical = parseDecimal(row[2] ?? "")
    const nivelAgua      = parseDecimal(row[3] ?? "")
    const pluviometria   = parseDecimal(row[4] ?? "")
    const observacao     = row[5]?.trim() || null

    // ignora linhas pré-preenchidas sem nenhuma medição
    if (secchiVertical === null && nivelAgua === null && pluviometria === null && !observacao) continue

    records.push({
      data:           isoDate,
      mes:            deriveMes(isoDate),
      local:          "Balneário Municipal",
      turbidez:       null,
      secchiVertical,
      nivelAgua,
      pluviometria,
      observacao,
      tenantId,
    })
  }

  return records
}

export async function syncBalnearioFromSheet(): Promise<UpsertResult & { error?: string }> {
  const tenantId = process.env.SEED_TENANT_ID
  if (!tenantId) return { inserted: 0, updated: 0, error: "SEED_TENANT_ID não configurado no ambiente." }

  const currentYear = new Date().getFullYear()
  const previousYear = currentYear - 1

  try {
    const [currentRows, previousRows] = await Promise.all([
      fetchAndParseYear(currentYear, tenantId),
      fetchAndParseYear(previousYear, tenantId),
    ])

    const allRows = [...previousRows, ...currentRows]
    const result = await upsertBalnearioDataBatch(allRows)
    return result
  } catch (err: any) {
    return { inserted: 0, updated: 0, error: err?.message ?? "Erro desconhecido" }
  }
}
