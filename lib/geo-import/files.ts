// O que fazer com cada arquivo solto no mapa.

export type DroppedKind = 'geojson' | 'raster' | 'desconhecido'

export function kindOfFile(name: string): DroppedKind {
  const n = name.toLowerCase()
  if (n.endsWith('.geojson') || n.endsWith('.json')) return 'geojson'
  if (n.endsWith('.tif') || n.endsWith('.tiff')) return 'raster'
  return 'desconhecido'
}

/** "desmatamento_alertas_mapbiomas_2019_2025.geojson" → "Desmatamento alertas mapbiomas 2019 2025": um nome que a pessoa só confirma. */
export function nameFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim()
  return base ? base[0].toUpperCase() + base.slice(1) : 'Nova camada'
}

/** A cor de partida pelo assunto do arquivo: fogo laranja, desmatamento vermelho, água azul. A pessoa só troca se quiser. */
export function colorFromFile(fileName: string): string {
  const n = fileName.toLowerCase()
  if (/fogo|queim|fire|incend|cicatriz/.test(n)) return '#ea580c'
  if (/desmat|supress|alerta/.test(n)) return '#dc2626'
  if (/agua|água|rio|hidro|bacia/.test(n)) return '#0284c7'
  return '#3b82f6'
}
