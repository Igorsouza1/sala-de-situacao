import type { BasemapKey } from './basemaps'

// Regras do Gerar mapa que não dependem da tela: qual base a folha oferece, o título que ela já traz e como se monta o estilo
// da folha (a base escolhida + as camadas de dados que a pessoa estava vendo).

// A folha oferece 3 bases (DESIGN.md regra 1: no máximo 3 escolhas). A base do mapa que não está aqui entra pela mais parecida.
export const PRINT_BASEMAPS: BasemapKey[] = ['satellite-soft', 'streets', 'mineral']

const NEAREST_PRINT_BASEMAP: Partial<Record<BasemapKey, BasemapKey>> = { satellite: 'satellite-soft', osm: 'streets' }

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
      layers.push(layer)
      taken.add(layer.id)
    }
  }

  return { ...base, sources, layers }
}

// O que a folha pode mostrar a mais: ligado por padrão, a pessoa desliga o que não quer (título, legenda e fonte dos dados não saem).
// O mapa de localização começa desligado. O logo e os textos livres não são interruptores: aparecem quando há imagem ou texto.
export const PART_IDS = ['north', 'scale', 'grid', 'datum', 'date', 'inset'] as const
export type Part = (typeof PART_IDS)[number]
export const DEFAULT_SHOW: Record<Part, boolean> = { north: true, scale: true, grid: true, datum: true, date: true, inset: false }

// Estilo da seta do norte: a clássica (com placa), a do PRISMA (imagem) e só o N (sem placa, com contorno branco).
export const NORTH_STYLES = ['classic', 'prisma', 'letter'] as const
export type NorthStyle = (typeof NORTH_STYLES)[number]
export const NORTH_LABELS: Record<NorthStyle, string> = { classic: 'Clássica', prisma: 'PRISMA', letter: 'Só o N' }
export const DEFAULT_NORTH_STYLE: NorthStyle = 'classic'

// A linha da grade em 5 graus, do 0 (sem linha: ficam só os números) ao mais forte. Sem número na tela: a pessoa vê o nome.
export const GRID_LEVELS = [0, 0.25, 0.5, 0.75, 1] as const
export const GRID_LEVEL_LABELS = ['Sem linha', 'Bem suave', 'Suave', 'Média', 'Forte'] as const
export const DEFAULT_GRID_LEVEL = 3
export const clampGridLevel = (n: unknown) => (typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < GRID_LEVELS.length ? n : DEFAULT_GRID_LEVEL)

// Onde ficam os números da grade: na margem da folha (padrão, como numa carta) ou dentro do mapa.
export const GRID_NUMBERS = ['margin', 'inside'] as const
export type GridNumbers = (typeof GRID_NUMBERS)[number]
export const DEFAULT_GRID_NUMBERS: GridNumbers = 'margin'

/** os três lugares do texto livre */
export interface Notes { title: string; map: string; side: string }
export const EMPTY_NOTES: Notes = { title: '', map: '', side: '' }
