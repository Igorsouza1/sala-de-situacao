import { differenceInCalendarDays, format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

// O estado de cada assunto do painel Situação, dito em palavras e em cor (DESIGN.md 2.1 e 7): a pessoa lê a frase, a cor só confirma.
export type Tom = "ok" | "atencao" | "crit" | "neutro"

export const TOM_COR: Record<Tom, string> = {
  ok: "var(--color-ok)",
  atencao: "var(--color-warn)",
  crit: "var(--color-crit)",
  neutro: "var(--color-stone)",
}

export const TOM_PALAVRA: Record<Tom, string> = {
  ok: "Tudo certo",
  atencao: "Atenção",
  crit: "Crítico",
  neutro: "Sem leitura",
}

// As faixas de turbidez do dashboard antigo (≤3 verde, 4–7 amarelo, 8–15 laranja, >15 vermelho) viram quatro frases e três tons.
export function turbidez(ntu: number | null | undefined): { tom: Tom; frase: string } {
  if (ntu == null || !Number.isFinite(ntu)) return { tom: "neutro", frase: "Sem medida de turbidez" }
  if (ntu <= 3) return { tom: "ok", frase: "Água clara" }
  if (ntu <= 7) return { tom: "atencao", frase: "Água um pouco turva" }
  if (ntu <= 15) return { tom: "atencao", frase: "Água turva" }
  return { tom: "crit", frase: "Água muito turva" }
}

// A visibilidade da Ponte do Cure já vem em palavras do campo.
export function visibilidade(valor: string | null | undefined): { tom: Tom; frase: string } {
  switch (valor) {
    case "cristalino": return { tom: "ok", frase: "Água cristalina" }
    case "turvo": return { tom: "atencao", frase: "Água turva" }
    case "muitoTurvo": return { tom: "crit", frase: "Água muito turva" }
    default: return { tom: "neutro", frase: "Sem registro de visibilidade" }
  }
}

// "quando" para um dia (AAAA-MM-DD ou ISO): a data some atrás de uma palavra que a pessoa entende sem contar.
export function quando(iso: string | null | undefined, hoje: Date = new Date()): string | null {
  if (!iso) return null
  const dia = parseISO(iso.length > 10 ? iso : `${iso}T00:00:00`)
  if (Number.isNaN(dia.getTime())) return null
  const dias = differenceInCalendarDays(hoje, dia)
  if (dias <= 0) return "hoje"
  if (dias === 1) return "ontem"
  if (dias < 30) return `há ${dias} dias`
  return `em ${format(dia, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
}

export function focos(atual: number | null | undefined, anterior: number | null | undefined, ultimo: string | null | undefined, hoje: Date = new Date()): { tom: Tom; frase: string; apoio: string } {
  if (atual == null) return { tom: "neutro", frase: "Sem leitura de focos", apoio: "Os focos não carregaram" }
  if (atual === 0) return { tom: "ok", frase: "Nenhum foco nos últimos 30 dias", apoio: "Satélite sem calor detectado" }
  const mais = anterior != null && atual > anterior
  return {
    tom: mais ? "crit" : "atencao",
    frase: `${atual} ${atual === 1 ? "foco" : "focos"} nos últimos 30 dias`,
    apoio: ultimo ? `Último foco ${quando(ultimo, hoje)}` : mais ? "Mais que nos 30 dias antes" : "Igual ou menos que nos 30 dias antes",
  }
}

// O desmatamento chega somado por ano e mês; "último alerta" é o mês mais recente com área.
export function desmatamento(porAno: Record<string, number[]> | null | undefined): { tom: Tom; frase: string; apoio: string; serie: number[] } {
  if (!porAno) return { tom: "neutro", frase: "Sem leitura de desmatamento", apoio: "Os alertas não carregaram", serie: [] }
  const anos = Object.keys(porAno).map(Number).filter(Number.isFinite).sort((a, b) => a - b)
  let ultimo: { ano: number; mes: number } | null = null
  for (const ano of anos) porAno[ano].forEach((ha, mes) => { if (ha > 0) ultimo = { ano, mes } })
  const serie = anos.length ? porAno[anos[anos.length - 1]] ?? [] : []
  if (!ultimo) return { tom: "ok", frase: "Nenhum alerta de desmatamento", apoio: "Nada registrado até agora", serie }
  const u = ultimo as { ano: number; mes: number }
  const ha = porAno[u.ano].reduce((s, v) => s + v, 0)
  const mes = format(new Date(u.ano, u.mes, 1), "MMMM 'de' yyyy", { locale: ptBR })
  return {
    tom: "atencao",
    frase: `${ha.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ha de alertas em ${u.ano}`,
    apoio: `Último alerta em ${mes}`,
    serie,
  }
}

export function javali(esteMes: number | null | undefined, mesAnterior: number | null | undefined): { tom: Tom; frase: string; apoio: string } {
  if (esteMes == null) return { tom: "neutro", frase: "Sem leitura de avistamentos", apoio: "Os relatos não carregaram" }
  if (esteMes === 0) return { tom: "ok", frase: "Nenhum relato de javali neste mês", apoio: "Avistamentos de campo e do formulário público" }
  return {
    tom: mesAnterior != null && esteMes > mesAnterior ? "atencao" : "neutro",
    frase: `${esteMes} ${esteMes === 1 ? "relato" : "relatos"} de javali neste mês`,
    apoio: mesAnterior != null ? `No mês passado foram ${mesAnterior}` : "Avistamentos de campo e do formulário público",
  }
}
