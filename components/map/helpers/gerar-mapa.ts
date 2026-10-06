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
// O mapa de localização e o texto livre começam desligados.
export const PART_IDS = ['north', 'scale', 'grid', 'datum', 'date', 'logos', 'inset', 'note'] as const
export type Part = (typeof PART_IDS)[number]
export const DEFAULT_SHOW: Record<Part, boolean> = { north: true, scale: true, grid: true, datum: true, date: true, logos: true, inset: false, note: false }
