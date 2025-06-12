
"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"

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
}

const DailyDequeContext = createContext<DailyDequeCtx | undefined>(undefined)

export function DailyDequeProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<DailyDequeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/dashboard/deque-pedras/daily")
      if (!res.ok) throw new Error("Falha ao buscar dados diários")
      setRaw(await res.json())
      setError(null)
    } catch (e: any) {
      console.error(e)
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <DailyDequeContext.Provider value={{ raw, isLoading, error, refetch: fetchData }}>
      {children}
    </DailyDequeContext.Provider>
  )
}

export function useDailyDeque() {
  const ctx = useContext(DailyDequeContext)
  if (!ctx) throw new Error("useDailyDeque deve ser usado dentro de DailyDequeProvider")
  return ctx
}
