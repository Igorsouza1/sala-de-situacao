import { tidyText } from './text'

// A legenda de uma camada de ícones, montada das REGRAS do catálogo e do que está de fato no mapa (DESIGN.md 13.7). Nas Ações o
// ícone diz a área (eixo temático) e a cor diz a situação; uma legenda só por áreas mostrava tudo cinza e a pessoa não entendia as
// cores dos pinos. Aqui cada dimensão ganha o seu bloco, e só aparece o que existe no mapa agora (nada de "Cancelado" se não há).

export interface RuleLegendEntry {
  key: string
  label: string
  color?: string
  iconName?: string
}
export interface RuleLegendSection {
  title: 'Cor' | 'Ícone'
  entries: RuleLegendEntry[]
}

interface Rule {
  field: string
  values: Record<string, unknown>
  styleProperty?: string
}

// O valor "Ativo" do campo caráter, sozinho, não diz do que fala: ganha o nome do campo
const FIELD_PREFIX: Record<string, string> = { carater: 'Caráter' }

function matchKey(rule: Rule, raw: unknown): string | null {
  if (raw === undefined || raw === null) return null
  const value = String(raw).trim()
  if (value in rule.values) return value
  const lower = value.toLowerCase()
  return Object.keys(rule.values).find((k) => k.toLowerCase() === lower) ?? null
}

const entryLabel = (rule: Rule, key: string) => {
  const text = tidyText(key)
  const prefix = FIELD_PREFIX[rule.field]
  return prefix ? `${prefix} ${text.toLowerCase()}` : text
}

/** de qual regra vem a cor e de qual vem o ícone desta feição; a última regra que casa e define a propriedade vence, como no desenho do marcador (resolveFeatureStyle) */
function classifyFeature(rules: Rule[], feature: { properties?: Record<string, unknown> | null }): { color: RuleLegendEntry | null; icon: RuleLegendEntry | null } {
  let color: RuleLegendEntry | null = null
  let icon: RuleLegendEntry | null = null
  for (const rule of rules) {
    const key = matchKey(rule, feature.properties?.[rule.field])
    if (key === null) continue
    const value = rule.values[key]
    const label = entryLabel(rule, key)
    const id = `${rule.field}:${key}`
    if (rule.styleProperty === 'color' && typeof value === 'string') color = { key: id, label, color: value }
    else if (rule.styleProperty === 'iconName' && typeof value === 'string') icon = { key: id, label, iconName: value }
    else if (!rule.styleProperty && value && typeof value === 'object') {
      const v = value as { color?: string; iconName?: string }
      if (v.color) color = { key: id, label, color: v.color }
      if (v.iconName) icon = { key: id, label, iconName: v.iconName }
    }
  }
  return { color, icon }
}

/** as feições que um item da legenda representa ("Identificado" na cor, "Solo & Relevo" no ícone, "Demais" no que não casou nenhuma regra) */
export function featuresForLegendEntry<T extends { properties?: Record<string, unknown> | null }>(
  config: { rules?: Rule[] } | null | undefined,
  features: T[],
  title: RuleLegendSection['title'],
  key: string,
): T[] {
  const rules = (config?.rules ?? []).filter((r) => r && r.values && typeof r.values === 'object')
  return features.filter((f) => {
    const { color, icon } = classifyFeature(rules, f)
    const hit = title === 'Cor' ? color : icon
    return (hit?.key ?? (title === 'Cor' ? 'base:color' : 'base:icon')) === key
  })
}

export function buildRuleLegend(
  config: { baseStyle?: { color?: string; iconName?: string }; rules?: Rule[] } | null | undefined,
  features: { properties?: Record<string, unknown> | null }[],
): RuleLegendSection[] {
  const rules = (config?.rules ?? []).filter((r) => r && r.values && typeof r.values === 'object')
  if (rules.length === 0 || features.length === 0) return []
  const base = config?.baseStyle ?? {}

  const colors = new Map<string, RuleLegendEntry>()
  const icons = new Map<string, RuleLegendEntry>()
  let colorFallback = false
  let iconFallback = false

  for (const feature of features) {
    const { color, icon } = classifyFeature(rules, feature)
    if (color) colors.set(color.key, color)
    else colorFallback = true
    if (icon) icons.set(icon.key, icon)
    else iconFallback = true
  }

  // estável: na ordem em que as regras dizem os valores, e o que casou por último na ordem das regras vence só dentro de cada feição
  const order = (m: Map<string, RuleLegendEntry>) => {
    const keys = rules.flatMap((r) => Object.keys(r.values).map((k) => `${r.field}:${k}`))
    return [...m.values()].sort((a, b) => keys.indexOf(a.key) - keys.indexOf(b.key))
  }

  const sections: RuleLegendSection[] = []
  const colorEntries = order(colors)
  if (colorFallback && colorEntries.length > 0 && base.color) colorEntries.push({ key: 'base:color', label: 'Demais', color: base.color })
  if (colorEntries.length > 0) sections.push({ title: 'Cor', entries: colorEntries })
  const iconEntries = order(icons)
  if (iconFallback && iconEntries.length > 0) iconEntries.push({ key: 'base:icon', label: 'Demais', iconName: base.iconName ?? 'map-pin' })
  if (iconEntries.length > 0) sections.push({ title: 'Ícone', entries: iconEntries })
  return sections
}
