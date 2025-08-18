"use client"

import { useState, useEffect } from "react"

export function useAcoesOptions() {
  const [acoesOptions, setAcoesOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAcoesOptions = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/acoes/options")
        if (response.ok) {
          const data = await response.json()
          setAcoesOptions(data.options || [])
        }
      } catch (error) {
        console.error("Erro ao carregar opções de ações:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAcoesOptions()
  }, [])

  return {
    acoesOptions,
    loading,
  }
}
