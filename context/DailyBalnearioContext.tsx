"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"

export interface DailyBalnearioEntry {
  id: number
  data: string           // ISO date "YYYY-MM-DD"
  turbidez: number | null
  secchiVertical: number | null
  nivelAgua: number | null
  pluviometria: number | null
}

interface DailyBalnearioCtx {
  raw: DailyBalnearioEntry[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

const DailyBalnearioContext = createContext<DailyBalnearioCtx | undefined>(undefined)

export function DailyBalnearioProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<DailyBalnearioEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/balneario-municipal/daily")
      if (!res.ok) throw new Error("Falha ao buscar dados diários do Balneário")
      const apiResponse = await res.json()
      if (apiResponse.success) {
        setRaw(apiResponse.data)
      } else {
        throw new Error(apiResponse.error?.message || "Erro da API")
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
    <DailyBalnearioContext.Provider value={{ raw, isLoading, error, refetch: fetchData }}>
      {children}
    </DailyBalnearioContext.Provider>
  )
}

export function useDailyBalneario() {
  const ctx = useContext(DailyBalnearioContext)
  if (!ctx) throw new Error("useDailyBalneario deve ser usado dentro de DailyBalnearioProvider")
  return ctx
}
