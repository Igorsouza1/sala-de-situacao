"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"

export interface DailyPonteCureEntry {
  id: number
  local: string
  data: string
  chuva: number
  nivel: number
  visibilidade: string
}

interface DailyPonteCureCtx {
  raw: DailyPonteCureEntry[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

const DailyPonteCureContext = createContext<DailyPonteCureCtx | undefined>(undefined)

export function DailyPonteCureProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<DailyPonteCureEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/ponte-cure/daily")
      if (!res.ok) throw new Error("Falha ao buscar dados diários")
      const apiResponse = await res.json()
      setRaw(apiResponse.data)
      setError(null)
    } catch (e: any) {
      console.error(e)
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <DailyPonteCureContext.Provider value={{ raw, isLoading, error, refetch: fetchData }}>
      {children}
    </DailyPonteCureContext.Provider>
  )
}

export function useDailyPonteCure() {
  const ctx = useContext(DailyPonteCureContext)
  if (!ctx) throw new Error("useDailyPonteCure deve ser usado dentro de DailyPonteCureProvider")
  return ctx
}
