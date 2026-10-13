// Imagens Sentinel-2 de antes e depois de um alerta (DESIGN.md 13.10). Funções puras: a busca fica em `service/sateliteService.ts`.

export interface CenaStac {
  id: string
  /** ISO, como o catálogo entrega */
  datetime: string
  /** porcentagem de nuvem na cena (0 a 100) */
  nuvem: number
}

export interface Cena {
  id: string
  /** AAAA-MM-DD */
  data: string
  nuvem: number
  /** não havia cena limpa: esta é a menos nublada que existe, e a tela avisa */
  nublada: boolean
}

export interface CenasDoAlerta {
  antes: Cena | null
  depois: Cena | null
  /** outras fotos limpas de antes, da mais recente para a mais antiga: a pessoa pede uma se o corte já aparece na escolhida */
  antesMaisAntigas: Cena[]
}

/** acima disto a nuvem atrapalha ver o chão */
export const NUVEM_LIMITE = 20
/** quanto tempo antes do alerta ainda vale procurar a imagem de "antes" */
export const DIAS_ANTES = 90
/** e depois: o satélite passa a cada 5 dias, dois meses cobrem a estação chuvosa */
export const DIAS_DEPOIS = 60

const MS_DIA = 86_400_000
const dia = (iso: string) => iso.slice(0, 10)

/** o intervalo da busca no catálogo, sem passar de hoje */
export function janelaDeBusca(dataAlerta: string, hoje: Date = new Date()): { inicio: string; fim: string } {
  const base = Date.parse(`${dataAlerta}T00:00:00Z`)
  const fim = Math.min(base + DIAS_DEPOIS * MS_DIA, hoje.getTime())
  return { inicio: new Date(base - DIAS_ANTES * MS_DIA).toISOString(), fim: new Date(fim).toISOString() }
}

/** dias entre a foto de "antes" e o alerta: o alerta é a data da detecção, e o corte costuma ter acontecido antes dela */
export const DIAS_FOLGA_ANTES = 30
/** as fotos antigas oferecidas ficam espaçadas, para cada uma mostrar algo diferente */
const DIAS_ENTRE_ANTIGAS = 10
const MAX_ANTIGAS = 3

const diaNum = (d: string) => Date.parse(`${d}T00:00:00Z`) / MS_DIA

/** a ordem em que as fotos de "antes" são tentadas: primeiro as com folga de 30 dias (da mais recente), depois as mais próximas */
export function ordemAntes(cenas: CenaStac[], dataAlerta: string): CenaStac[] {
  const corte = new Date(Date.parse(`${dataAlerta}T00:00:00Z`) - DIAS_FOLGA_ANTES * MS_DIA).toISOString().slice(0, 10)
  const anteriores = cenas.filter((c) => dia(c.datetime) < dataAlerta).sort((a, b) => b.datetime.localeCompare(a.datetime))
  return [...anteriores.filter((c) => dia(c.datetime) <= corte), ...anteriores.filter((c) => dia(c.datetime) > corte)]
}

/** a ordem de "depois": a primeira a partir do dia do alerta */
export function ordemDepois(cenas: CenaStac[], dataAlerta: string): CenaStac[] {
  return cenas.filter((c) => dia(c.datetime) >= dataAlerta).sort((a, b) => a.datetime.localeCompare(b.datetime))
}

const paraCena = (c: CenaStac, nublada: boolean): Cena => ({ id: c.id, data: dia(c.datetime), nuvem: c.nuvem, nublada })

function melhor(ordenadas: CenaStac[]): Cena | null {
  if (ordenadas.length === 0) return null
  const limpa = ordenadas.find((c) => c.nuvem <= NUVEM_LIMITE)
  if (limpa) return paraCena(limpa, false)
  // sem foto limpa: a menos nublada (na ordem de tentativa, no empate)
  return paraCena(ordenadas.reduce((m, c) => (c.nuvem < m.nuvem ? c : m)), true)
}

/** quantas fotos de cada lado vale medir de perto (cada medida é uma consulta ao satélite) */
export const MEDIR_POR_LADO = 8

/** as fotos que valem a medida local de nuvem: as primeiras de cada lado, na ordem em que seriam escolhidas */
export function paraMedir(cenas: CenaStac[], dataAlerta: string): string[] {
  const ids = [...ordemAntes(cenas, dataAlerta).slice(0, MEDIR_POR_LADO), ...ordemDepois(cenas, dataAlerta).slice(0, MEDIR_POR_LADO)]
  return ids.map((c) => c.id)
}

/** "antes": a foto limpa mais recente com folga antes do alerta; "depois": a primeira limpa a partir do dia dele */
export function escolherCenas(cenas: CenaStac[], dataAlerta: string): CenasDoAlerta {
  const ordemA = ordemAntes(cenas, dataAlerta)
  const antes = melhor(ordemA)
  const antigas: Cena[] = []
  if (antes && !antes.nublada) {
    let ultima = diaNum(antes.data)
    for (const c of ordemA) {
      const d = diaNum(dia(c.datetime))
      if (d >= diaNum(antes.data) || c.nuvem > NUVEM_LIMITE) continue
      if (ultima - d < DIAS_ENTRE_ANTIGAS) continue
      antigas.push(paraCena(c, false))
      ultima = d
      if (antigas.length >= MAX_ANTIGAS) break
    }
  }
  return { antes, depois: melhor(ordemDepois(cenas, dataAlerta)), antesMaisAntigas: antigas }
}

/** nuvem de verdade na área da foto (%), a partir da classificação de cada ponto: sombra de nuvem (3), nuvem média e alta (8, 9) e cirro (10) */
export function nuvemLocal(histograma: [number[], number[]]): number | null {
  const [contagens, classes] = histograma
  const total = contagens.reduce((a, b) => a + b, 0)
  if (!total) return null
  const nuvem = classes.reduce((soma, classe, i) => ([3, 8, 9, 10].includes(classe) ? soma + contagens[i] : soma), 0)
  return (nuvem / total) * 100
}

export type Caixa = [number, number, number, number]

const M_POR_GRAU = 111_320
/** o recorte nunca é menor que isto: uma área de poucos hectares ficaria sem contexto para a pessoa se orientar */
export const LADO_MINIMO_M = 600
export const LADO_MAXIMO_M = 3000

/**
 * A caixa quadrada (em metros) que a foto mostra: o alerta no meio, com o dobro de entorno de cada lado, para ver o que
 * mudou e onde. Só essa área é pedida ao satélite, não o mapa inteiro.
 */
export function recorteDoAlerta(alerta: Caixa): Caixa {
  const [w, s, e, n] = alerta
  const lat = (s + n) / 2
  const lng = (w + e) / 2
  const cos = Math.max(Math.cos((lat * Math.PI) / 180), 0.01)
  const alertaM = Math.max((e - w) * M_POR_GRAU * cos, (n - s) * M_POR_GRAU)
  const lado = Math.min(LADO_MAXIMO_M, Math.max(LADO_MINIMO_M, alertaM * 3))
  const meioLat = lado / 2 / M_POR_GRAU
  const meioLng = lado / 2 / (M_POR_GRAU * cos)
  return [lng - meioLng, lat - meioLat, lng + meioLng, lat + meioLat]
}

/** a foto da cena, só dessa caixa, em cores naturais (10 m por ponto), quadrada */
export function urlRecorteSentinel(itemId: string, caixa: Caixa, px = 400): string {
  return `https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/${caixa.map((v) => v.toFixed(6)).join(",")}/${px}x${px}.jpg?collection=sentinel-2-l2a&item=${encodeURIComponent(itemId)}&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0`
}

type Anel = number[][]
type GeometriaLinear = { type: string; coordinates?: unknown }

function aneis(g: GeometriaLinear): Anel[] {
  if (g.type === "Polygon") return g.coordinates as Anel[]
  if (g.type === "MultiPolygon") return (g.coordinates as Anel[][]).flat()
  return []
}

/** o contorno do alerta como caminho de SVG na foto (0 a `px`): só o fio, para não esconder o que mudou */
export function contornoNoRecorte(g: GeometriaLinear, caixa: Caixa, px = 400): string {
  const [w, s, e, n] = caixa
  return aneis(g)
    .map((anel) => anel.map(([x, y], i) => `${i === 0 ? "M" : "L"}${(((x - w) / (e - w)) * px).toFixed(1)} ${(((n - y) / (n - s)) * px).toFixed(1)}`).join(" ") + " Z")
    .join(" ")
}

/** a nuvem dita em palavras: ninguém precisa ler uma porcentagem (DESIGN.md regra 1) */
export function nuvemEmPalavras(nuvem: number): string {
  if (nuvem <= 5) return "sem nuvens"
  if (nuvem <= NUVEM_LIMITE) return "com poucas nuvens"
  if (nuvem <= 50) return "com bastante nuvem"
  return "quase toda coberta de nuvens"
}
