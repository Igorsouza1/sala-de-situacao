// Os textos do item "Regiões" do menu da conta (DESIGN.md 13.11). Puro, para o teste.

export interface RegionOption {
  id: number
  nome: string
  municipio: string | null
  uf: string | null
  organizacao: string | null
}

/** Mais de uma Organização na lista (o Superadmin, ou quem tem papel em mais de uma): aí cada linha diz de quem é a Região. */
export const mixesOrganizations = (list: RegionOption[]) => new Set(list.map((r) => r.organizacao ?? '')).size > 1

/** A linha de apoio de uma Região: "Bonito/MS", com a Organização quando a lista mistura Organizações. Sem nada a dizer, null. */
export function regionCaption(r: RegionOption, withOrganization: boolean): string | null {
  const place = r.municipio ? `${r.municipio}${r.uf ? `/${r.uf}` : ''}` : null
  const org = withOrganization ? r.organizacao : null
  return [place, org].filter(Boolean).join(' · ') || null
}

/** Onde a pessoa está, dito embaixo de "Regiões": o nome da Região aberta, ou o conjunto quando o endereço não escolhe uma. */
export function currentRegionLabel(list: RegionOption[], currentId: number | null): string {
  return list.find((r) => r.id === currentId)?.nome ?? 'Todas as suas regiões'
}

/** O endereço do mapa numa Região, mantendo o resto do que está no endereço. */
export function regionHref(pathname: string, search: string, id: number): string {
  const params = new URLSearchParams(search)
  params.set('regiao_id', String(id))
  return `${pathname}?${params}`
}
