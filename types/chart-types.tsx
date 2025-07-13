export interface RawDataPoint {
  data: string
  turbidez: number
  secchiVertical: number
  chuva: number
}

export interface SeriePonto {
  diaFmt: string
  originalDate: string
  turbidez: number
  turbidezMedia7d: number
  secchiVert: number
  chuva: number
}

export interface DailyDequeContextType {
  raw: RawDataPoint[]
  isLoading: boolean
  error: string | null
  trend: {
    tendencia: "alta" | "baixa" | "estavel"
    variacao: number
  }
}

export interface BrushChangeEvent {
  startIndex?: number
  endIndex?: number
}

export type PresetKey = "7 d" | "15 d" | "30 d"
export type PresetValue = number | null

export interface ChartRange {
  start: number
  end: number
}  