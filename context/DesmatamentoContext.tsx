"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface DesmatamentoData {
  [year: number]: number[]
}

interface DesmatamentoContextType {
  desmatamentoData: DesmatamentoData
  filteredDesmatamentoData: number[]
  isLoading: boolean
  error: string | null
  setSelectedYear: (year: string) => void
  selectedYear: string
}

const DesmatamentoContext = createContext<DesmatamentoContextType | undefined>(undefined)

export function DesmatamentoProvider({ children }: { children: ReactNode }) {
  const [desmatamentoData, setDesmatamentoData] = useState<DesmatamentoData>({})
  const [filteredDesmatamentoData, setFilteredDesmatamentoData] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>("todos")

  useEffect(() => {
    async function fetchDesmatamentoData() {
      try {
        const response = await fetch("/api/dashboard/desmatamento")
        if (!response.ok) {
          throw new Error("Falha ao buscar dados")
        }
        const data = await response.json()
        setDesmatamentoData(data)
      } catch (err) {
        setError("Erro ao carregar dados de desmatamento")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDesmatamentoData()
  }, [])

  useEffect(() => {
    if (selectedYear === "todos") {
      const allYearsData = Object.values(desmatamentoData).reduce((acc: number[], yearData: number[]) => {
        return acc.map((value, index) => value + (yearData[index] || 0))
      }, Array(12).fill(0))
      setFilteredDesmatamentoData(allYearsData)
    } else {
      const yearNumber = Number.parseInt(selectedYear, 10)
      setFilteredDesmatamentoData(desmatamentoData[yearNumber] || Array(12).fill(0))
    }
  }, [selectedYear, desmatamentoData])

  return (
    <DesmatamentoContext.Provider
      value={{ desmatamentoData, filteredDesmatamentoData, isLoading, error, setSelectedYear, selectedYear }}
    >
      {children}
    </DesmatamentoContext.Provider>
  )
}

export function useDesmatamento() {
  const context = useContext(DesmatamentoContext)
  if (context === undefined) {
    throw new Error("useDesmatamento must be used within a DesmatamentoProvider")
  }
  return context
}

