// Quantas ações por ano, para o resumo das Ações (DESIGN.md 13.13). Puro, para o teste.

export interface YearCount {
  year: number
  count: number
}

/** O ano de cada ação (do campo `time`), com os anos sem ação no meio valendo zero: um buraco no tempo não pode sumir do gráfico. */
/** `field` pode trazer a data (texto) ou o ano já pronto (número); um item com `count` vale por esse tanto de ações. */
export function countByYear(features: { properties?: Record<string, unknown> | null; count?: number }[], field = 'time'): { years: YearCount[]; undated: number } {
  const counts = new Map<number, number>()
  let undated = 0
  for (const f of features) {
    const by = f.count ?? 1
    const raw = f.properties?.[field]
    const year = typeof raw === 'number' ? raw : typeof raw === 'string' || raw instanceof Date ? new Date(raw).getUTCFullYear() : NaN
    if (!Number.isFinite(year) || year < 1900) { undated += by; continue }
    counts.set(year, (counts.get(year) ?? 0) + by)
  }
  if (!counts.size) return { years: [], undated }
  const min = Math.min(...counts.keys())
  const max = Math.max(...counts.keys())
  const years: YearCount[] = []
  for (let y = min; y <= max; y++) years.push({ year: y, count: counts.get(y) ?? 0 })
  return { years, undated }
}
