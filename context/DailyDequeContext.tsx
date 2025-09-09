
"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from "react"

export interface DailyDequeEntry {
  id: number
  data: string          // ISO
  turbidez: number
  chuva: number
  secchiVertical: number
  secchiHorizontal: number
}

interface DailyDequeCtx {
  raw: DailyDequeEntry[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  trend: {
    tendencia: string
    variacao: number
  }
}

const DailyDequeContext = createContext<DailyDequeCtx | undefined>(undefined)

export function DailyDequeProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<DailyDequeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const trend = useMemo(() => {
    if (!raw.length) return { tendencia: "estavel", variacao: 0 }

    const sorted = raw
      .slice()
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    const last = sorted.slice(-7)
    if (last.length < 2) return { tendencia: "estavel", variacao: 0 }

    const variacao = Number(
      (last[last.length - 1].turbidez - last[0].turbidez).toFixed(2),
    )

    let tendencia: "alta" | "baixa" | "estavel" = "estavel"
    if (variacao > 0.1) tendencia = "alta"
    else if (variacao < -0.1) tendencia = "baixa"

    return { tendencia, variacao }
  }, [raw])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/deque-pedras/daily")
      if(!res.ok){
        throw new Error("Falha ao buscar dados diários")
      }

      const apiResponse = await res.json()

      if(apiResponse.success){
        setRaw(apiResponse.data)
      }else{
        throw new Error(apiResponse.error)
      }
    } catch (e: any) {
      console.error(e)
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <DailyDequeContext.Provider
      value={{ raw, isLoading, error, refetch: fetchData, trend }}
    >
      {children}
    </DailyDequeContext.Provider>
  )
}

export function useDailyDeque() {
  const ctx = useContext(DailyDequeContext)
  if (!ctx) throw new Error("useDailyDeque deve ser usado dentro de DailyDequeProvider")
  return ctx
}