"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface Acao {
  id: number
  name: string
  latitude: number
  longitude: number
  elevation: number
  time: string
  descricao: string
  mes: string
  atuacao: string
  acao: string
}

interface AcoesContextType {
  acoes: Acao[]
  filteredAcoes: Acao[]
  isLoading: boolean
  error: string | null
  setSelectedYear: (year: string) => void
  selectedYear: string
}

const AcoesContext = createContext<AcoesContextType | undefined>(undefined)

export function AcoesProvider({ children }: { children: ReactNode }) {
  const [acoes, setAcoes] = useState<Acao[]>([])
  const [filteredAcoes, setFilteredAcoes] = useState<Acao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>("todos")

  useEffect(() => {
    async function fetchAcoes() {
      try {
        const response = await fetch("/api/acoes?view=dashboard")
        if (!response.ok) {
          throw new Error("Falha ao buscar dados")
        }
        const data = await response.json()
        setAcoes(data)
        setFilteredAcoes(data)
      } catch (err) {
        setError("Erro ao carregar dados de ações")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAcoes()
  }, [])

  useEffect(() => {
    if (selectedYear === "todos") {
      setFilteredAcoes(acoes)
    } else {
      const filtered = acoes.filter((acao) => {
        const acaoYear = new Date(acao.time).getFullYear().toString()
        return acaoYear === selectedYear
      })
      setFilteredAcoes(filtered)
    }
  }, [selectedYear, acoes])

  return (
    <AcoesContext.Provider value={{ acoes, filteredAcoes, isLoading, error, setSelectedYear, selectedYear }}>
      {children}
    </AcoesContext.Provider>
  )
}

export function useAcoes() {
  const context = useContext(AcoesContext)
  if (context === undefined) {
    throw new Error("useAcoes must be used within an AcoesProvider")
  }
  return context
}

