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
  isLoading: boolean
  error: string | null
}

const AcoesContext = createContext<AcoesContextType | undefined>(undefined)

export function AcoesProvider({ children }: { children: ReactNode }) {
  const [acoes, setAcoes] = useState<Acao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAcoes() {
      try {
        const response = await fetch("/api/dashboard/acoes")
        if (!response.ok) {
          throw new Error("Falha ao buscar dados")
        }
        const data = await response.json()
        setAcoes(data)
      } catch (err) {
        setError("Erro ao carregar dados de ações")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAcoes()
  }, [])

  return <AcoesContext.Provider value={{ acoes, isLoading, error }}>{children}</AcoesContext.Provider>
}

export function useAcoes() {
  const context = useContext(AcoesContext)
  if (context === undefined) {
    throw new Error("useAcoes must be used within an AcoesProvider")
  }
  return context
}

