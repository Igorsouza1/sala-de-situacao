"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface BalnearioMunicipalData {
  pluviometria: number
  turbidezMax: number
  turbidezMin: number
  turbidezMedia: number
  nivelAguaMedia: number
}

interface BalnearioMunicipalContextType {
  balnearioData: Record<number, BalnearioMunicipalData[]>
  filteredBalnearioData: BalnearioMunicipalData[]
  isLoading: boolean
  error: string | null
  setSelectedYear: (year: string) => void
  selectedYear: string
}

const BalnearioMunicipalContext = createContext<BalnearioMunicipalContextType | undefined>(undefined)

export function BalnearioMunicipalProvider({ children }: { children: ReactNode }) {
  const [balnearioData, setBalnearioData] = useState<Record<number, BalnearioMunicipalData[]>>({})
  const [filteredBalnearioData, setFilteredBalnearioData] = useState<BalnearioMunicipalData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>("todos")

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/balneario-municipal")
        if (!response.ok) throw new Error("Falha ao buscar dados")
        const apiResponse = await response.json()
        if (apiResponse.success) {
          setBalnearioData(apiResponse.data)
        } else {
          throw new Error(apiResponse.error?.message || "Erro retornado pela API")
        }
      } catch (err) {
        setError("Erro ao carregar dados do Balneário Municipal")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (selectedYear === "todos") {
      const allYearsData = Object.values(balnearioData).reduce(
        (acc, yearData) => {
          return acc.map((monthData, index) => ({
            pluviometria: monthData.pluviometria + (yearData[index]?.pluviometria || 0),
            turbidezMax: Math.max(monthData.turbidezMax, yearData[index]?.turbidezMax || 0),
            turbidezMin: Math.min(monthData.turbidezMin, yearData[index]?.turbidezMin || Infinity),
            turbidezMedia: monthData.turbidezMedia + (yearData[index]?.turbidezMedia || 0),
            nivelAguaMedia: monthData.nivelAguaMedia + (yearData[index]?.nivelAguaMedia || 0),
          }))
        },
        Array(12).fill({ pluviometria: 0, turbidezMax: 0, turbidezMin: Infinity, turbidezMedia: 0, nivelAguaMedia: 0 }),
      )

      const count = Object.keys(balnearioData).length || 1
      allYearsData.forEach((m) => {
        m.turbidezMedia /= count
        m.nivelAguaMedia /= count
      })

      setFilteredBalnearioData(allYearsData)
    } else {
      const yearNumber = parseInt(selectedYear, 10)
      setFilteredBalnearioData(balnearioData[yearNumber] || [])
    }
  }, [selectedYear, balnearioData])

  return (
    <BalnearioMunicipalContext.Provider
      value={{ balnearioData, filteredBalnearioData, isLoading, error, setSelectedYear, selectedYear }}
    >
      {children}
    </BalnearioMunicipalContext.Provider>
  )
}

export function useBalnearioMunicipal() {
  const context = useContext(BalnearioMunicipalContext)
  if (context === undefined) {
    throw new Error("useBalnearioMunicipal must be used within a BalnearioMunicipalProvider")
  }
  return context
}
