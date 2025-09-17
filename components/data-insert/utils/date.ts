export type MesFormato =
  | "Janeiro"
  | "Fevereiro"
  | "Marco"
  | "Abril"
  | "Maio"
  | "Junho"
  | "julho"
  | "Agosto"
  | "Setembro"
  | "Outubro"
  | "Novembro"
  | "Dezembro"

const mesesMap: Record<number, MesFormato> = {
  0: "Janeiro",
  1: "Fevereiro",
  2: "Marco",
  3: "Abril",
  4: "Maio",
  5: "Junho",
  6: "julho",
  7: "Agosto",
  8: "Setembro",
  9: "Outubro",
  10: "Novembro",
  11: "Dezembro",
}

export function deriveMes(dateString: string): MesFormato {
  const [, m] = dateString.split("-").map(Number) // "YYYY-MM-DD"
  const monthIndex = m - 1 // porque Janeiro = 0
  return mesesMap[monthIndex] || "Janeiro"
}

export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR")
}

export function formatDateTimeForDisplay(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString("pt-BR")
}
