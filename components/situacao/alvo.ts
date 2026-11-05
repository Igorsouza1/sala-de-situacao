// O que o detalhe do painel Situação mostra. `item` é o registro clicado no mapa (um foco, um polígono de desmatamento);
// sem item, a pessoa veio pelo cartão do resumo e vê só a série.
import type { FogoMensalFonte } from "@/lib/situacao/fontes"

export type TipoAlvo = "focos" | "fogoMensal" | "desmatamento" | "javali" | "formoso" | "prata" | "cure"

export interface Alvo {
  tipo: TipoAlvo
  item?: Record<string, unknown>
  /** área queimada: a série (raster de fogo por mês) que o detalhe mostra */
  fogo?: FogoMensalFonte
  /** desmatamento de uma camada importada, e não da tabela de alertas */
  camada?: { slug: string; nome: string }
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
