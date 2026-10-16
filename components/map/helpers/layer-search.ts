// A busca na lista de camadas (DESIGN.md 13.1): acha pelo nome, sem se importar com acento nem com maiúscula, e todas as palavras
// digitadas precisam aparecer. Uma camada com grupos (Ações por eixo) também é achada pelo nome de um grupo.

const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export interface Searchable {
  slug: string
  label: string
  subOptions?: { label: string }[]
}

/** Os termos da busca, já sem acento; vazio quando a pessoa não digitou nada. */
export const searchTerms = (query: string): string[] => plain(query).split(/\s+/).filter(Boolean)

/** Os slugs que casam com a busca. Sem termos, não há busca (devolve null: nada é filtrado). */
export function matchLayers(options: Searchable[], query: string): Set<string> | null {
  const terms = searchTerms(query)
  if (terms.length === 0) return null
  const found = new Set<string>()
  for (const option of options) {
    const text = plain([option.label, ...(option.subOptions ?? []).map((s) => s.label)].join(' '))
    if (terms.every((t) => text.includes(t))) found.add(option.slug)
  }
  return found
}
