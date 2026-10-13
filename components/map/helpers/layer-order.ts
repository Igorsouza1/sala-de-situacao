// A ordem das camadas no mapa (DESIGN.md 13.1): quem vem depois fica POR CIMA. É escolha da pessoa, por região, e fica no navegador
// junto das camadas ligadas (13.2). Aqui mora só a conta, sem tela e sem mapa, para ser testada.
//
// Todas as listas deste módulo vão "de baixo para cima", a mesma ordem do catálogo e da pilha do MapLibre. A tela mostra ao contrário
// (a de cima da lista é a de cima do mapa), e quem converte é quem chama.

/**
 * A ordem em que as camadas entram no mapa. `saved` é o que a pessoa escolheu: o que ela não conhece (camada nova, ou que ela
 * nunca ordenou) entra logo depois da camada que vinha antes dela no catálogo, e o que sumiu do catálogo é esquecido.
 * `isUnder` marca as que, no padrão, ficam no fundo (os rasters importados: uma mancha de fogo não pode cobrir os alertas).
 */
export function stackOrder<T extends { slug: string }>(layers: T[], saved: string[] | undefined, isUnder: (layer: T) => boolean = () => false): T[] {
  const base = [...layers.filter(isUnder), ...layers.filter((l) => !isUnder(l))]
  const bySlug = new Map(base.map((l) => [l.slug, l]))
  const kept = (saved ?? []).filter((slug, i, all) => bySlug.has(slug) && all.indexOf(slug) === i)
  const keptSet = new Set(kept)
  const result = [...kept]
  base.forEach((layer, i) => {
    if (keptSet.has(layer.slug)) return
    let at = 0
    for (let j = i - 1; j >= 0; j--) {
      const found = result.indexOf(base[j].slug)
      if (found >= 0) { at = found + 1; break }
    }
    result.splice(at, 0, layer.slug)
  })
  return result.map((slug) => bySlug.get(slug)!)
}

export const sameOrder = (a: string[], b: string[]) => a.length === b.length && a.every((s, i) => s === b[i])

/** As camadas do MapLibre que uma camada do catálogo pode ter, de baixo para cima (o raster importado fica sob as suas feições). */
export const stackIdsOf = (slug: string): string[] => [
  `raster-${slug}-layer`,
  `${slug}-fill`,
  `${slug}-outline`,
  `${slug}-line`,
  `${slug}-circle`,
  `${slug}-hover-circle`,
]

export interface StackMove {
  id: string
  /** a camada de cima que fica logo depois; sem ela, vai para o topo */
  before?: string
}

/**
 * O que mover no MapLibre para as camadas ficarem na ordem pedida. `current` é a pilha de agora (de baixo para cima).
 * As camadas de dados ficam onde estão em relação ao resto (o destaque, a prévia e os rótulos continuam por cima delas);
 * só muda a ordem entre elas. Já na ordem, devolve vazio: quem chama pode rodar a toda hora, sem custo e sem laço.
 */
export function planStackMoves(current: string[], slugs: string[]): StackMove[] {
  const present = new Set(current)
  const want = slugs.flatMap(stackIdsOf).filter((id) => present.has(id))
  if (want.length < 2) return []

  const wantSet = new Set(want)
  const now = current.filter((id) => wantSet.has(id))
  if (sameOrder(now, want)) return []

  let top = -1
  current.forEach((id, i) => { if (wantSet.has(id)) top = i })
  const before = current[top + 1]
  return want.map((id) => ({ id, before }))
}
