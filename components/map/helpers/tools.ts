// Ferramentas de modo do mapa (DESIGN.md 13): só uma fica ativa por vez, e o que o clique faz depende dela.
export type Tool = 'measure-distance' | 'measure-area' | 'coords' | 'property'

export const TOOL_LABELS: Record<Tool, string> = {
  'measure-distance': 'Distância',
  'measure-area': 'Área',
  coords: 'Coordenadas',
  property: 'Propriedade',
}

export const isMeasureTool = (tool: Tool | null): tool is 'measure-distance' | 'measure-area' =>
  tool === 'measure-distance' || tool === 'measure-area'

export const formatDistance = (meters: number) =>
  meters >= 1000
    ? `${(meters / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`
    : `${Math.round(meters)} m`

export const formatArea = (sqMeters: number) =>
  `${(sqMeters / 10000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`

export const formatCoordinate = (lat: number, lng: number) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`
