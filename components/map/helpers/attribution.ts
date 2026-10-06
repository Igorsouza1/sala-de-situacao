// Os créditos do mapa (DESIGN.md 13.7). Os provedores (Esri, OpenStreetMap, OpenFreeMap) EXIGEM que a atribuição esteja à vista de quem
// usa o mapa. O botão do MapLibre abria expandido e brigava com a legenda, então os créditos moram no controle de canto, atrás de um
// botão. O texto vem do estilo do mapa (HTML de terceiros): só texto e links http(s) passam, nenhum outro elemento.

export interface AttributionPart {
  text: string
  href?: string
}

const decode = (s: string) =>
  s.replace(/&copy;/gi, '©').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&nbsp;/gi, ' ')
const plain = (html: string) => decode(html.replace(/<[^>]*>/g, ''))
const safeHref = (href: string) => (/^https?:\/\//i.test(href.trim()) ? href.trim() : undefined)

export function parseAttribution(html: string): AttributionPart[] {
  const parts: AttributionPart[] = []
  const link = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let last = 0
  for (const m of html.matchAll(link)) {
    const before = plain(html.slice(last, m.index))
    if (before.trim()) parts.push({ text: before })
    const text = plain(m[2])
    if (text.trim()) parts.push({ text, href: safeHref(m[1]) })
    last = (m.index ?? 0) + m[0].length
  }
  const rest = plain(html.slice(last))
  if (rest.trim()) parts.push({ text: rest })
  return parts
}

/** a atribuição de cada fonte do estilo, sem repetir */
export function collectAttributions(style: { sources?: Record<string, { attribution?: string }> } | null | undefined): string[] {
  const seen = new Set<string>()
  for (const source of Object.values(style?.sources ?? {})) {
    const html = source?.attribution?.trim()
    if (html) seen.add(html)
  }
  return [...seen]
}
