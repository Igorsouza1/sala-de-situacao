"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRegiao } from "./RegiaoContext"
import { PontoMonitoramento, RegistroMonitoramento } from "@/db/schema"

interface MonitoramentoContextType {
  pontos: PontoMonitoramento[]
  selectedPonto: PontoMonitoramento | null
  setSelectedPonto: (ponto: PontoMonitoramento | null) => void
  registros: RegistroMonitoramento[]
  isLoadingPontos: boolean
  isLoadingRegistros: boolean
  error: string | null
}

const MonitoramentoContext = createContext<MonitoramentoContextType | undefined>(undefined)

export function MonitoramentoProvider({ children }: { children: ReactNode }) {
  const [pontos, setPontos] = useState<PontoMonitoramento[]>([])
  const [selectedPonto, setSelectedPonto] = useState<PontoMonitoramento | null>(null)
  const [registros, setRegistros] = useState<RegistroMonitoramento[]>([])
  const [isLoadingPontos, setIsLoadingPontos] = useState(true)
  const [isLoadingRegistros, setIsLoadingRegistros] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { selectedRegionId } = useRegiao()

  // Efeito para buscar os pontos de monitoramento da região selecionada
  useEffect(() => {
    async function fetchPontos() {
      if (!selectedRegionId) return;
      setIsLoadingPontos(true);
      setError(null);
      try {
        const response = await fetch(`/api/monitoramento?regiaoId=${selectedRegionId}`);
        if (!response.ok) throw new Error("Falha ao buscar pontos de monitoramento");
        const data = await response.json();
        setPontos(data);
        setSelectedPonto(null); // Reseta o ponto selecionado ao mudar de região
        setRegistros([]); // Limpa os registros
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar pontos");
      } finally {
        setIsLoadingPontos(false);
      }
    }
    fetchPontos();
  }, [selectedRegionId]);

  // Efeito para buscar os registros do ponto de monitoramento selecionado
  useEffect(() => {
    async function fetchRegistros() {
      if (!selectedPonto) return;
      setIsLoadingRegistros(true);
      setError(null);
      try {
        const response = await fetch(`/api/monitoramento?pontoId=${selectedPonto.id}`);
        if (!response.ok) throw new Error("Falha ao buscar registros de monitoramento");
        const data = await response.json();
        setRegistros(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar registros");
      } finally {
        setIsLoadingRegistros(false);
      }
    }
    fetchRegistros();
  }, [selectedPonto]);

  return (
    <MonitoramentoContext.Provider
      value={{
        pontos,
        selectedPonto,
        setSelectedPonto,
        registros,
        isLoadingPontos,
        isLoadingRegistros,
        error,
      }}
    >
      {children}
    </MonitoramentoContext.Provider>
  )
}

export function useMonitoramento() {
  const context = useContext(MonitoramentoContext)
  if (context === undefined) {
    throw new Error("useMonitoramento must be used within a MonitoramentoProvider")
  }
  return context
}
