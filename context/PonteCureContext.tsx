"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface PonteCureData {
  chuva: number
  nivel: number[]
  visibilidade: {
    cristalino: number
    turvo: number
    muitoTurvo: number
  }
}

interface PonteCureContextType {
  ponteCureData: Record<number, PonteCureData[]>
  filteredPonteCureData: PonteCureData[]
  isLoading: boolean
  error: string | null
  setSelectedYear: (year: string) => void
  selectedYear: string
}

const PonteCureContext = createContext<PonteCureContextType | undefined>(undefined)

export function PonteCureProvider({ children }: { children: ReactNode }) {
  const [ponteCureData, setPonteCureData] = useState<Record<number, PonteCureData[]>>({})
  const [filteredPonteCureData, setFilteredPonteCureData] = useState<PonteCureData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>("todos")

  useEffect(() => {
    async function fetchPonteCureData() {
      try {
        const response = await fetch("/api/dashboard/ponte-cure")
        if (!response.ok) {
          throw new Error("Falha ao buscar dados")
        }
        const data = await response.json()
        setPonteCureData(data)
      } catch (err) {
        setError("Erro ao carregar dados da Ponte do Cure")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPonteCureData()
  }, [])

  useEffect(() => {
    if (selectedYear === "todos") {
      const allYearsData = Object.values(ponteCureData).reduce(
        (acc, yearData) => {
          return acc.map((monthData, index) => ({
            chuva: monthData.chuva + (yearData[index]?.chuva || 0),
            nivel: [...monthData.nivel, ...(yearData[index]?.nivel || [])],
            visibilidade: {
              cristalino: monthData.visibilidade.cristalino + (yearData[index]?.visibilidade.cristalino || 0),
              turvo: monthData.visibilidade.turvo + (yearData[index]?.visibilidade.turvo || 0),
              muitoTurvo: monthData.visibilidade.muitoTurvo + (yearData[index]?.visibilidade.muitoTurvo || 0),
            },
          }))
        },
        Array(12).fill({ chuva: 0, nivel: [], visibilidade: { cristalino: 0, turvo: 0, muitoTurvo: 0 } }),
      )

      setFilteredPonteCureData(allYearsData)
    } else {
      const yearNumber = Number.parseInt(selectedYear, 10)
      setFilteredPonteCureData(ponteCureData[yearNumber] || [])
    }
  }, [selectedYear, ponteCureData])

  return (
    <PonteCureContext.Provider
      value={{ ponteCureData, filteredPonteCureData, isLoading, error, setSelectedYear, selectedYear }}
    >
      {children}
    </PonteCureContext.Provider>
  )
}

export function usePonteCure() {
  const context = useContext(PonteCureContext)
  if (context === undefined) {
    throw new Error("usePonteCure must be used within a PonteCureProvider")
  }
  return context
}

