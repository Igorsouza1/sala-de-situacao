"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRegiao } from "./RegiaoContext"

interface FogoData {
  [year: number]: number[]
}

interface FogoContextType {
  fogoData: FogoData
  filteredFogoData: number[]
  isLoading: boolean
  error: string | null
  setSelectedYear: (year: string) => void
  selectedYear: string
}

const FogoContext = createContext<FogoContextType | undefined>(undefined)

export function FogoProvider({ children }: { children: ReactNode }) {
  const [fogoData, setFogoData] = useState<FogoData>({})
  const [filteredFogoData, setFilteredFogoData] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>("todos")
  const { selectedRegionId } = useRegiao()

  useEffect(() => {
    async function fetchFogoData() {
      if (!selectedRegionId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/fogo?regiaoId=${selectedRegionId}`)
        if (!response.ok) {
          throw new Error("Falha ao buscar dados")
        }
        const apiResponse = await response.json()
        setFogoData(apiResponse.data)
      } catch (err) {
        setError("Erro ao carregar dados de focos de incêndio")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFogoData()
  }, [selectedRegionId])

  useEffect(() => {
    if (selectedYear === "todos") {
      const allYearsData = Object.values(fogoData).reduce((acc: number[], yearData: number[]) => {
        return acc.map((value, index) => value + (yearData[index] || 0))
      }, Array(12).fill(0))
      setFilteredFogoData(allYearsData)
    } else {
      const yearNumber = Number.parseInt(selectedYear, 10)
      setFilteredFogoData(fogoData[yearNumber] || Array(12).fill(0))
    }
  }, [selectedYear, fogoData])

  return (
    <FogoContext.Provider value={{ fogoData, filteredFogoData, isLoading, error, setSelectedYear, selectedYear }}>
      {children}
    </FogoContext.Provider>
  )
}

export function useFogo() {
  const context = useContext(FogoContext)
  if (context === undefined) {
    throw new Error("useFogo must be used within a FogoProvider")
  }
  return context
}

