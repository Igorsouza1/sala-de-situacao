// Aparência de uma camada do catálogo (DESIGN.md 13.3). É o ÚNICO lugar que sabe ler e gravar `layer_catalog.visual_config`
// para a aparência, usado pelo servidor (que grava), pelo editor (pré-visualização) e pela legenda (que lê).
//
// Por que existe: o catálogo guarda a aparência em dois lugares. O mapa principal desenha com `maplibre.paint` quando ele existe
// (e cai no `baseStyle` quando não), enquanto o Leaflet e a legenda liam só o `baseStyle`. Editar só um deles não mudava o outro:
// a legenda de Propriedades dizia #22c55e e o mapa desenhava #32a852. Aqui a leitura segue a MESMA precedência do mapa, e a gravação
// põe o valor nos dois lugares.
//
// Tudo o que não é aparência (rules, popupFields, groupByColumn, charts…) passa intacto.

export type LayerShape = 'fill' | 'line' | 'circle' | 'icon' | 'other'

export interface LayerStyle {
  shape: LayerShape
  /** contorno (polígono), linha, borda do ponto, cor do ícone */
  color: string
  /** miolo do polígono ou do ponto */
  fillColor: string
  /** transparência do preenchimento, de 0 a 1 */
  fillOpacity: number
  /** transparência do contorno, da linha ou do ponto, de 0 a 1 */
  opacity: number
  /** espessura do contorno, da linha ou da borda do ponto */
  weight: number
  radius: number
  iconName?: string
}

export const LAYER_CATEGORIES = ['Operacional', 'Monitoramento', 'Base Territorial', 'Infraestrutura', 'Uploads'] as const
export type LayerCategory = (typeof LAYER_CATEGORIES)[number]

/** Tudo o que a pessoa pode editar numa camada. O `slug` nunca: o código decide comportamento por ele. */
export interface LayerEdit {
  name: string
  category: LayerCategory
  defaultVisibility: boolean
  style: LayerStyle
  /**
   * Ícone de cada área de uma camada com grupos (ex.: cada eixo temático de Ações), pelo valor que o mapa compara.
   * Vem da regra por valor do catálogo (`rules` com `styleProperty: 'iconName'`), que é o que o mapa usa para desenhar o marcador.
   */
  ruleIcons?: Record<string, string>
}

type Json = Record<string, any>

// O mesmo azul de reserva do mapa (helpers/maplibre-layer.ts)
const FALLBACK_COLOR = '#3b82f6'

// Geometria manda sobre o estilo, como no mapa (resolveLayerType): quem chama pode passar a da primeira feição.
export function layerShape(vc: Json | null | undefined, geometryType?: string | null): LayerShape {
  const ml = vc?.maplibre
  const base: Json = vc?.baseStyle ?? vc ?? {}
  if (ml?.type === 'icon-marker' || base.type === 'icon') return 'icon'
  if (ml?.type === 'fill' || ml?.type === 'line' || ml?.type === 'circle') return ml.type
  if (ml?.type === 'heatmap' || base.type === 'heatmap') return 'other'
  if (geometryType === 'Point' || geometryType === 'MultiPoint') return 'circle'
  if (geometryType === 'LineString' || geometryType === 'MultiLineString') return 'line'
  if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') return 'fill'
  const hint = base.type ?? vc?.mapMarker?.type
  if (hint === 'line') return 'line'
  if (hint === 'circle' || hint === 'point') return 'circle'
  return 'fill'
}

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const str = (v: unknown, fallback: string) => (typeof v === 'string' && v ? v : fallback)

export function readStyle(vc: Json | null | undefined, geometryType?: string | null): LayerStyle {
  const shape = layerShape(vc, geometryType)
  const marker: Json = vc?.mapMarker ?? {}
  const s: Json = { ...marker, ...(vc?.baseStyle ?? vc ?? {}) }
  const paint: Json = vc?.maplibre?.paint ?? {}
  const outline: Json = vc?.maplibre?.outlinePaint ?? {}
  const iconName: string | undefined = s.iconName ?? marker.icon ?? undefined
  const out = (o: Partial<LayerStyle> & Pick<LayerStyle, 'color' | 'fillColor'>): LayerStyle => ({
    shape, fillOpacity: 0.5, opacity: 0.8, weight: 1, radius: 6, iconName, ...o,
  })

  if (shape === 'fill') {
    const fillColor = str(paint['fill-color'], str(s.fillColor, str(s.color, FALLBACK_COLOR)))
    return out({
      fillColor,
      color: str(outline['line-color'], str(paint['fill-outline-color'], str(s.color, FALLBACK_COLOR))),
      fillOpacity: num(paint['fill-opacity'], num(s.fillOpacity, num(s.opacity, 0.5))),
      weight: num(outline['line-width'], num(s.weight, 1)),
      opacity: num(outline['line-opacity'], num(s.opacity, 0.8)),
    })
  }
  if (shape === 'line') {
    const color = str(paint['line-color'], str(s.color, FALLBACK_COLOR))
    return out({
      color,
      fillColor: color,
      weight: num(paint['line-width'], num(s.weight, 2)),
      opacity: num(paint['line-opacity'], num(s.opacity, 0.8)),
    })
  }
  if (shape === 'circle') {
    // com `paint`, o miolo é circle-color e a borda é circle-stroke-*; sem ele, o mapa pinta o ponto com `color` e sem borda
    const hasPaint = !!vc?.maplibre?.paint
    const body = str(paint['circle-color'], str(s.color, FALLBACK_COLOR))
    return out({
      fillColor: body,
      color: hasPaint ? str(paint['circle-stroke-color'], body) : body,
      weight: hasPaint ? num(paint['circle-stroke-width'], 0) : 0,
      radius: num(paint['circle-radius'], num(s.radius, 6)),
      opacity: num(paint['circle-opacity'], num(s.opacity, 0.8)),
    })
  }
  const color = str(s.color, FALLBACK_COLOR)
  return out({ color, fillColor: color, radius: num(s.radius, 28) })
}

// ── Ícone por área (regra por valor) ────────────────────────────────────────────────────────────────────────────
const iconRule = (vc: Json | null | undefined): Json | undefined =>
  Array.isArray(vc?.rules) ? vc!.rules.find((r: Json) => r?.styleProperty === 'iconName' && r.values && typeof r.values === 'object') : undefined

export const hasIconRule = (vc: Json | null | undefined) => !!iconRule(vc)

/** O ícone que o mapa usa para um valor (ex.: um eixo temático). Compara como o mapa: igual, ou sem diferenciar maiúsculas. */
export function ruleIcon(vc: Json | null | undefined, key: string): string | undefined {
  const values: Json | undefined = iconRule(vc)?.values
  if (!values) return undefined
  const found = key in values ? key : Object.keys(values).find((k) => k.toLowerCase() === key.trim().toLowerCase())
  const v = found !== undefined ? values[found] : undefined
  return typeof v === 'string' ? v : undefined
}

// `defaultVisibleFallback`: o que vale quando o catálogo não diz nada (a lista de camadas que abrem ligadas, no código).
export function readEdit(
  layer: { name: string; visualConfig?: Json | null },
  opts: { geometryType?: string | null; defaultVisibleFallback?: boolean } = {},
): LayerEdit {
  const vc = layer.visualConfig
  const category = LAYER_CATEGORIES.includes(vc?.category) ? (vc!.category as LayerCategory) : 'Base Territorial'
  return {
    name: layer.name,
    category,
    defaultVisibility: typeof vc?.defaultVisibility === 'boolean' ? vc.defaultVisibility : (opts.defaultVisibleFallback ?? false),
    style: readStyle(vc, opts.geometryType),
    ruleIcons: ruleIconsOf(vc),
  }
}

function ruleIconsOf(vc: Json | null | undefined): Record<string, string> | undefined {
  const values: Json | undefined = iconRule(vc)?.values
  if (!values) return undefined
  return Object.fromEntries(Object.entries(values).filter(([, v]) => typeof v === 'string')) as Record<string, string>
}

// Põe a aparência nos dois lugares: no `baseStyle` sempre (o Leaflet e a reserva do mapa leem dele) e no `maplibre` quando ele
// existe (o mapa principal lê dele primeiro). Só toca nas chaves de aparência; o resto do JSON fica como estava.
export function applyStyle(vc: Json | null | undefined, style: LayerStyle): Json {
  const out: Json = JSON.parse(JSON.stringify(vc ?? {}))
  // visual_config "plano" (sem baseStyle): o baseStyle novo parte das chaves planas, senão ele passaria a mandar e apagaria o resto
  const flat: Json = {}
  if (!out.baseStyle) {
    for (const k of ['type', 'color', 'fillColor', 'weight', 'opacity', 'fillOpacity', 'radius', 'dashArray', 'iconName']) {
      if (out[k] !== undefined) flat[k] = out[k]
    }
  }
  const base: Json = (out.baseStyle = { ...flat, ...(out.baseStyle ?? {}) })
  const ml: Json | undefined = out.maplibre
  const paint: Json | undefined = ml?.paint

  if (style.shape === 'fill') {
    Object.assign(base, { color: style.color, fillColor: style.fillColor, fillOpacity: style.fillOpacity, weight: style.weight, opacity: style.opacity })
    if (paint) {
      paint['fill-color'] = style.fillColor
      paint['fill-opacity'] = style.fillOpacity
      if ('fill-outline-color' in paint) paint['fill-outline-color'] = style.color
    }
    if (ml?.outlinePaint) {
      Object.assign(ml.outlinePaint, { 'line-color': style.color, 'line-width': style.weight, 'line-opacity': style.opacity })
    }
  } else if (style.shape === 'line') {
    Object.assign(base, { color: style.color, weight: style.weight, opacity: style.opacity })
    if (paint) Object.assign(paint, { 'line-color': style.color, 'line-width': style.weight, 'line-opacity': style.opacity })
  } else if (style.shape === 'circle') {
    Object.assign(base, { fillColor: style.fillColor, radius: style.radius, opacity: style.opacity, weight: style.weight })
    if (paint) {
      Object.assign(paint, {
        'circle-color': style.fillColor,
        'circle-radius': style.radius,
        'circle-opacity': style.opacity,
        'circle-stroke-color': style.color,
        'circle-stroke-width': style.weight,
      })
      base.color = style.color // semântica do Leaflet: contorno
    } else {
      base.color = style.fillColor // sem `paint`, o mapa pinta o ponto com `color`
    }
  } else if (style.shape === 'icon') {
    Object.assign(base, { color: style.color })
    if (style.iconName) base.iconName = style.iconName
  }
  return out
}

export function applyEdit(vc: Json | null | undefined, edit: LayerEdit): Json {
  const out = applyStyle(vc, edit.style)
  out.category = edit.category
  out.defaultVisibility = edit.defaultVisibility
  // ícone de cada área: grava na regra por valor que o mapa já lê, sem mexer nas outras regras nem nas chaves que não mudaram
  const rule = iconRule(out)
  if (rule && edit.ruleIcons) {
    for (const [key, icon] of Object.entries(edit.ruleIcons)) {
      const existing = key in rule.values ? key : Object.keys(rule.values).find((k) => k.toLowerCase() === key.trim().toLowerCase())
      rule.values[existing ?? key] = icon
    }
  }
  return out
}

// Os campos que o editor pode mexer, por tipo de camada: o painel só mostra o que faz sentido (e a rota só aceita o que é dele).
export interface EditableFields {
  stroke: boolean
  fill: boolean
  fillOpacity: boolean
  weight: boolean
  radius: boolean
  icon: boolean
}

export function editableFields(shape: LayerShape): EditableFields {
  return {
    stroke: shape !== 'other',
    fill: shape === 'fill' || shape === 'circle',
    fillOpacity: shape === 'fill',
    weight: shape === 'fill' || shape === 'line' || shape === 'circle',
    radius: shape === 'circle',
    icon: shape === 'icon',
  }
}

// A cor deve ser #rgb ou #rrggbb: é o que o mapa, a legenda e o Leaflet entendem.
export const isHexColor = (v: unknown): v is string => typeof v === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)

// ── O editor fala em palavras, não em números (DESIGN.md 2.2 e 13.3) ─────────────────────────────────────────────
// A tela decide os números: a pessoa escolhe "Fina", "Suave", "Pequeno", e o editor traduz. Um valor que já está no catálogo e
// não bate com nenhum degrau (ex.: espessura 1,5) aparece marcado no degrau mais próximo e só muda se a pessoa escolher outro.
export interface Level {
  label: string
  value: number
}

export const FILL_LEVELS: Level[] = [
  { label: 'Só contorno', value: 0 },
  { label: 'Suave', value: 0.25 },
  { label: 'Cheio', value: 0.6 },
]
export const LINE_WEIGHTS: Level[] = [
  { label: 'Fina', value: 1 },
  { label: 'Média', value: 2 },
  { label: 'Grossa', value: 4 },
]
export const POINT_SIZES: Level[] = [
  { label: 'Pequeno', value: 4 },
  { label: 'Médio', value: 7 },
  { label: 'Grande', value: 11 },
]

export const nearestLevel = (levels: Level[], value: number): Level =>
  levels.reduce((best, l) => (Math.abs(l.value - value) < Math.abs(best.value - value) ? l : best), levels[0])

// O contorno acompanha a cor escolhida, um tom mais escuro: a pessoa escolhe UMA cor e a tela cuida do resto.
export function deriveOutline(hex: string): string {
  const h = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
  const channel = (i: number) => Math.round(parseInt(h.slice(i, i + 2), 16) * 0.65).toString(16).padStart(2, '0')
  return `#${channel(1)}${channel(3)}${channel(5)}`
}

/** A cor que a pessoa vê e escolhe: o miolo do polígono e do ponto, a linha, o ícone. */
export function mainColor(style: LayerStyle): string {
  return style.shape === 'fill' || style.shape === 'circle' ? style.fillColor : style.color
}

export function withMainColor(style: LayerStyle, color: string): LayerStyle {
  switch (style.shape) {
    case 'fill':
      return { ...style, fillColor: color, color: deriveOutline(color) }
    case 'circle':
      // a borda do ponto fica como está (a das nascentes é branca), a não ser que ela só seguisse o miolo
      return { ...style, fillColor: color, color: style.color === style.fillColor ? color : style.color }
    case 'line':
    case 'icon':
      return { ...style, color, fillColor: color }
    default:
      return style
  }
}
