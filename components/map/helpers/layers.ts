// Regras das camadas do mapa (DESIGN.md 13.1) que não dependem de tela.

// Os filtros não são globais: o período só mexe nestas camadas, e o tamanho só na de propriedades.
// Por isso o painel Filtros diz onde cada filtro vale (2.1).
export const DATE_SENSITIVE_SLUGS = new Set(['acoes', 'raw_firms', 'desmatamento'])
export const AREA_SENSITIVE_SLUGS = new Set(['propriedades'])

// O mapa abre só com o que responde "o que está acontecendo?". O resto a pessoa liga: abrir tudo carrega as camadas pesadas
// (propriedades chega a demorar uns 10 s) antes de ela decidir o que quer ver.
const DEFAULT_ON_SLUGS = ['propriedades', 'raw_firms', 'desmatamento', 'acoes']

type LayerLike = { slug: string; groups?: { id: string | number }[] | null }

// Os identificadores de uma camada: os dos grupos dela e o dela mesma.
const slugsOf = (l: LayerLike) => [...(l.groups ?? []).map((g) => `${l.slug}__${g.id}`), l.slug]

// Se a região não tem nenhuma das camadas-padrão (ex.: uma região só com a Rede Amolar), liga todas: abrir em branco não ajuda.
export function initialVisibleSlugs(layers: LayerLike[]): string[] {
  const wanted = layers.filter((l) => DEFAULT_ON_SLUGS.includes(l.slug))
  return (wanted.length ? wanted : layers).flatMap(slugsOf)
}

// As camadas que a pessoa deixou ligadas, só as que ainda existem. Camada nova no catálogo abre desligada (a pessoa não a escolheu).
// Se tudo o que estava salvo sumiu do catálogo, volta ao padrão; mas uma lista vazia salva (ela ocultou todas) é uma escolha, e vale.
export function restoreVisibleSlugs(layers: LayerLike[], saved: string[] | undefined): string[] {
  if (!saved) return initialVisibleSlugs(layers)
  const known = new Set(layers.flatMap(slugsOf))
  const valid = saved.filter((s) => known.has(s))
  return saved.length > 0 && valid.length === 0 ? initialVisibleSlugs(layers) : valid
}

// Uma camada está "ligada" quando ela, ou algum grupo dela, está na lista de visíveis.
export const isLayerOn = (slug: string, visible: string[]) => visible.some((v) => v === slug || v.startsWith(`${slug}__`))

export type FilterNote = 'período' | 'tamanho'

export function filterNoteFor(slug: string, dateOn: boolean, areaOn: boolean): FilterNote | null {
  if (dateOn && DATE_SENSITIVE_SLUGS.has(slug)) return 'período'
  if (areaOn && AREA_SENSITIVE_SLUGS.has(slug)) return 'tamanho'
  return null
}

// Frase da linha da camada quando um filtro está mexendo nela. Zero resultado é o caso que mais confunde (2.1, "o filtro escondeu tudo").
export const filterLine = (note: FilterNote, count: number | undefined) =>
  count === 0 ? `Nenhum resultado para o ${note} escolhido.` : `Filtrada pelo ${note}.`

// "Vale para: A, B e C." e, se nenhuma delas está ligada, o que fazer. Quando o filtro vale para uma só camada, de mesmo nome
// que o título (Propriedades), dizer "Vale para: Propriedades" seria ruído: só avisa se ela está desligada.
export function affectsLine(names: string[], anyOn: boolean, title?: string): string | null {
  if (names.length === 0) return null
  if (names.length === 1 && title && names[0].toLowerCase() === title.toLowerCase()) {
    return anyOn ? null : 'Está desligada em Camadas: ligue para ver o efeito.'
  }
  const list = new Intl.ListFormat('pt-BR', { style: 'long', type: 'conjunction' }).format(names)
  return `Vale para: ${list}.${anyOn ? '' : ' Nenhuma está ligada: ligue uma em Camadas para ver o efeito.'}`
}
