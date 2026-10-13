// Sem parâmetro, as rotas preservam a consulta completa. O painel Situação envia o ano escolhido.
export function historyYear(request: Request): number | null | undefined {
  const value = new URL(request.url).searchParams.get("year")
  if (value == null || value === "todos") return null
  if (!/^\d{4}$/.test(value)) return undefined
  const year = Number(value)
  return year >= 1900 && year <= new Date().getFullYear() ? year : undefined
}
