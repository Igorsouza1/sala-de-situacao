// O que o detalhe do painel Situação mostra. `item` é o registro clicado no mapa (um foco, um polígono de desmatamento);
// sem item, a pessoa veio pelo cartão do resumo e vê só a série.
import type { Geometry } from "geojson"
import { ehCamadaDeDesmatamento, type FogoMensalFonte } from "@/lib/situacao/fontes"

export type TipoAlvo = "focos" | "fogoMensal" | "desmatamento" | "javali" | "formoso" | "prata" | "cure"

export interface Alvo {
  tipo: TipoAlvo
  item?: Record<string, unknown>
  /** área queimada: a série (raster de fogo por mês) que o detalhe mostra */
  fogo?: FogoMensalFonte
  /** desmatamento de uma camada importada, e não da tabela de alertas */
  camada?: { slug: string; nome: string }
  /** veio do recorte por área: o nome da área (o detalhe diz que os números são só de dentro dela) */
  area?: string
  /** recorte: o desmatamento de dentro da área já veio do servidor (ano → hectares por mês); o detalhe não busca de novo */
  desmatamentoDados?: Record<number, number[]>
}

/** A área clicada no mapa que recorta a Situação: um polígono (`featureId`) de uma camada (`slug`) da região. */
export interface Recorte {
  slug: string
  featureId: number
  /** as propriedades do polígono, para "Ver os dados da área" (o modal de antes) */
  propriedades: Record<string, unknown>
}

// A camada do mapa que abre cada assunto (slug do catálogo): o clique no mapa e o clique no cartão levam ao mesmo detalhe.
const POR_CAMADA: Record<string, TipoAlvo> = {
  raw_firms: "focos",
  firms: "focos",
  desmatamento: "desmatamento",
  "deque-de-pedras": "prata",
  "ponte-do-cure": "cure",
}

export function alvoDaCamada(slug: string, props: Record<string, unknown>): Alvo | null {
  const tipo = POR_CAMADA[slug]
  if (!tipo) return null
  // estação é um ponto fixo: o que importa é a série dela, não as propriedades do ponto
  return tipo === "focos" || tipo === "desmatamento" ? { tipo, item: props } : { tipo }
}

// Camadas que não recortam: as que já abrem outra coisa (Explorar, um assunto) ou são o próprio assunto.
const SEM_RECORTE = new Set(["acoes", "propriedades", "estradas", ...Object.keys(POR_CAMADA)])

/**
 * O clique num polígono de uma camada da região vira um recorte da Situação. Não recorta: ponto ou linha, polígono sem id (não dá
 * para pedir a área inteira ao servidor), as camadas de SEM_RECORTE e as de alertas de desmatamento (o alerta é o assunto, não
 * uma área para olhar dentro).
 */
export function recorteDoClique(
  slug: string,
  nomeDaCamada: string,
  props: Record<string, unknown>,
  geometria: Geometry | undefined,
  featureId: string | number | undefined,
): Recorte | null {
  if (geometria?.type !== "Polygon" && geometria?.type !== "MultiPolygon") return null
  if (SEM_RECORTE.has(slug) || ehCamadaDeDesmatamento({ slug, name: nomeDaCamada, schemaConfig: null })) return null
  const id = Number(featureId)
  if (!Number.isSafeInteger(id) || id <= 0) return null
  return { slug, featureId: id, propriedades: props }
}
