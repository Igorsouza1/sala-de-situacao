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
        const response = await fetch("/api/acoes?view=dashboard");
        const apiResponse = await response.json(); // Renomeado para clareza
    
        // 1. Verificamos o campo 'success' do nosso envelope
        if (apiResponse.success) {
          // 2. Se for sucesso, colocamos o conteúdo de 'apiResponse.data' no estado
          const acoesData = apiResponse.data || []; // Garante que seja um array
          setAcoes(acoesData);
          setFilteredAcoes(acoesData);
        } else {
          // 3. Se a API retornou um erro, nós usamos a mensagem de erro do envelope
          throw new Error(apiResponse.error?.message || "Erro retornado pela API");
        }
    
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados de ações");
        console.error(err);
      } finally {
        setIsLoading(false);
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

