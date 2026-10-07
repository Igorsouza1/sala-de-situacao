import type { BasemapKey } from './basemaps'

// Regras do Gerar mapa que não dependem da tela: qual base a folha oferece, o título que ela já traz e como se monta o estilo
// da folha (a base escolhida + as camadas de dados que a pessoa estava vendo).

// A folha oferece 10 bases, em três grupos de nomes que dizem o uso (exceção à regra 1, registrada em 13.9: quem imprime escolhe o
// estilo do papel, e cada um serve a um assunto). A base do mapa que não está aqui entra pela mais parecida.
export const PRINT_BASEMAP_GROUPS: { title: string; keys: BasemapKey[] }[] = [
  { title: 'Foto de satélite', keys: ['satellite-soft', 'satellite'] },
  { title: 'Limpos', keys: ['mineral', 'light', 'streets', 'dark'] },
  { title: 'Com mais detalhe', keys: ['voyager', 'osm', 'topo', 'natgeo'] },
]
export const PRINT_BASEMAPS: BasemapKey[] = PRINT_BASEMAP_GROUPS.flatMap((g) => g.keys)

const NEAREST_PRINT_BASEMAP: Partial<Record<BasemapKey, BasemapKey>> = {}
export const printBasemapFor = (key: BasemapKey): BasemapKey => NEAREST_PRINT_BASEMAP[key] ?? key

const clean = (s: string) => s.trim().replace(/\s+/g, ' ')

/** o título que a folha já traz: o que o mapa mostra e onde ("Focos de calor e Propriedades em Rio da Prata") */
export function autoTitle(regionName: string | null | undefined, layerNames: string[]): string {
  const region = clean(regionName ?? '')
  const names = [...new Set(layerNames.map(clean).filter(Boolean))]
  if (names.length === 0) return region ? `Mapa de ${region}` : 'Mapa'
  const what =
    names.length <= 2
      ? names.join(' e ')
      : `${names[0]}, ${names[1]} e mais ${names.length - 2} ${names.length - 2 === 1 ? 'camada' : 'camadas'}`
  return region ? `${what} em ${region}` : what
}

type Json = Record<string, any>

/**
 * Monta o estilo da folha: a base escolhida, o relevo sombreado (se a base usa), e as camadas de dados tiradas do retrato do mapa
 * (`snapshot`, o que `map.getStyle()` devolve). `dataSourceIds` diz quais fontes são dados da pessoa: o resto do retrato (a base
 * da tela, a seleção do Explorar, a régua, a piscada da legenda) é só da tela e não vai para o papel.
 */
export function composeSheetStyle(
  base: Json,
  snapshot: Json | null | undefined,
  dataSourceIds: string[],
  hillshade: { source: Json; paint: Json } | null,
  only?: { source: string; ids: number[] } | null,
): Json {
  const ids = new Set(dataSourceIds)
  const sources: Json = { ...base.sources }
  const layers: Json[] = [...(base.layers ?? [])]
  const taken = new Set(layers.map((l) => l.id))

  if (hillshade) {
    sources.dem = hillshade.source
    layers.push({ id: 'relevo', type: 'hillshade', source: 'dem', paint: hillshade.paint })
    taken.add('relevo')
  }

  if (snapshot) {
    for (const id of ids) if (snapshot.sources?.[id]) sources[id] = snapshot.sources[id]
    for (const layer of snapshot.layers ?? []) {
      if (!ids.has(layer.source) || taken.has(layer.id)) continue
      // "só estas": a camada desenha apenas as feições escolhidas, sem mexer nos dados (a legenda e o mapa principal seguem iguais)
      const pick = only && layer.source === only.source ? ['in', ['get', 'id'], ['literal', only.ids]] : null
      layers.push(pick ? { ...layer, filter: layer.filter ? ['all', layer.filter, pick] : pick } : layer)
      taken.add(layer.id)
    }
  }

  return { ...base, sources, layers }
}

// Como as ações aparecem na folha: o mapa troca o ponto pelo ícone ao chegar perto (zoom 13); na folha a pessoa pode fixar um
// dos dois, para mostrar os ícones com o mapa longe (ou só pontos, perto).
export const MARKER_LOOKS = ['auto', 'icon', 'dot'] as const
export type MarkerLook = (typeof MARKER_LOOKS)[number]
export const DEFAULT_MARKER_LOOK: MarkerLook = 'auto'
export const MARKER_LOOK_LABELS: Record<MarkerLook, string> = { auto: 'Automático', icon: 'Ícone', dot: 'Ponto' }

// O que a folha pode mostrar a mais: ligado por padrão, a pessoa desliga o que não quer (título, legenda e fonte dos dados não saem).
// O mapa de localização começa desligado. O logo e os textos livres não são interruptores: aparecem quando há imagem ou texto.
export const PART_IDS = ['north', 'scale', 'grid', 'datum', 'date', 'inset'] as const
export type Part = (typeof PART_IDS)[number]
export const DEFAULT_SHOW: Record<Part, boolean> = { north: true, scale: true, grid: true, datum: true, date: true, inset: false }

// Estilo da seta do norte: só o N (sem placa, com contorno branco; a mais bonita e a que vem marcada), a do PRISMA (imagem) e a clássica (com placa).
export const NORTH_STYLES = ['letter', 'prisma', 'classic'] as const
export type NorthStyle = (typeof NORTH_STYLES)[number]
export const NORTH_LABELS: Record<NorthStyle, string> = { classic: 'Clássica', prisma: 'PRISMA', letter: 'Só o N' }
export const DEFAULT_NORTH_STYLE: NorthStyle = 'letter'

// O alinhamento do título (e da linha de apoio abaixo dele) na faixa do cabeçalho.
export const TITLE_ALIGNS = ['left', 'center', 'right'] as const
export type TitleAlign = (typeof TITLE_ALIGNS)[number]
export const TITLE_ALIGN_LABELS: Record<TitleAlign, string> = { left: 'Esquerda', center: 'Centro', right: 'Direita' }
export const DEFAULT_TITLE_ALIGN: TitleAlign = 'left'

// A linha da grade em 5 graus, do 0 (sem linha: ficam só os números) ao mais forte. Sem número na tela: a pessoa vê o nome.
export const GRID_LEVELS = [0, 0.25, 0.5, 0.75, 1] as const
export const GRID_LEVEL_LABELS = ['Sem linha', 'Bem suave', 'Suave', 'Média', 'Forte'] as const
export const DEFAULT_GRID_LEVEL = 3
export const clampGridLevel = (n: unknown) => (typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < GRID_LEVELS.length ? n : DEFAULT_GRID_LEVEL)

// Onde ficam os números da grade: na margem da folha (padrão, como numa carta) ou dentro do mapa.
export const GRID_NUMBERS = ['margin', 'inside'] as const
export type GridNumbers = (typeof GRID_NUMBERS)[number]
export const DEFAULT_GRID_NUMBERS: GridNumbers = 'margin'

// Texto livre: blocos soltos na folha. A pessoa adiciona, escreve direto nele e o arrasta para onde quiser (sobre o mapa, embaixo do
// título, na coluna da legenda, na margem). Cada bloco tem um estilo, um tamanho e uma letra, escolhidos com a folha à vista.

/** como o bloco se destaca do que está por baixo: placa branca com sombra, letra com contorno branco (sem fundo) ou letra branca com sombra */
export const BLOCK_STYLES = ['plate', 'outline', 'light'] as const
export type BlockStyle = (typeof BLOCK_STYLES)[number]
export const BLOCK_STYLE_LABELS: Record<BlockStyle, string> = { plate: 'Fundo branco', outline: 'Contorno', light: 'Letra branca' }

export const BLOCK_SIZES = ['s', 'm', 'l'] as const
export type BlockSize = (typeof BLOCK_SIZES)[number]
export const BLOCK_SIZE_LABELS: Record<BlockSize, string> = { s: 'Pequeno', m: 'Médio', l: 'Grande' }
/** altura da letra no papel, em mm */
export const BLOCK_SIZE_MM: Record<BlockSize, number> = { s: 2.8, m: 3.6, l: 5 }

export const BLOCK_FONTS = ['normal', 'bold', 'mono'] as const
export type BlockFont = (typeof BLOCK_FONTS)[number]
export const BLOCK_FONT_LABELS: Record<BlockFont, string> = { normal: 'Normal', bold: 'Negrito', mono: 'Mono' }

export interface BlockLook { style: BlockStyle; size: BlockSize; font: BlockFont }
export const DEFAULT_LOOK: BlockLook = { style: 'plate', size: 'm', font: 'normal' }

/** um texto solto; x e y são o centro dele, de 0 a 1 da largura e da altura da FOLHA */
export interface MapBlock extends BlockLook { id: string; text: string; x: number; y: number }
export const MAX_BLOCKS = 8
export const MAX_BLOCK_CHARS = 240
const EDGE = 0.02 // o centro não chega mais perto que isto da borda: o bloco nunca some da folha
export const clampPos = (v: number) => Math.min(1 - EDGE, Math.max(EDGE, v))

let seq = 0
/** um bloco novo no meio da folha, com o jeito do último que a pessoa mexeu; os seguintes descem um pouco, para não nascerem em cima do anterior */
export function newBlock(existing: MapBlock[], look: BlockLook = DEFAULT_LOOK): MapBlock {
  seq += 1
  return { ...look, id: `b${Date.now().toString(36)}${seq}`, text: '', x: 0.5, y: clampPos(0.4 + (existing.length % 5) * 0.08) }
}
