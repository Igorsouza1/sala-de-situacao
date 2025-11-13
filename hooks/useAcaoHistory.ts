// hooks/useAcaoHistory.ts
"use client"

import { useState, useEffect, useCallback } from 'react';
// Não precisamos mais dos tipos do schema aqui, o Service já tratou
// import type { acoesInRioDaPrata, fotosAcoesInRioDaPrata } from '@/db/schema';

// --- Definição dos Tipos (O que esperamos da API) ---
type AcaoUpdate = {
  id: string; // 'acao-1' ou 'foto-123'
  tipoUpdate: 'criacao' | 'midia';
  descricao: string | null;
  urlMidia: string | null;
  timestamp: string | null;
};

// O objeto 'dossie' que o hook vai retornar
export type AcaoDossie = {
  id: number;
  name: string | null;
  latitude: string | null;
  longitude: string | null;
  elevation: string | null;
  time: string | null;
  descricao: string | null;
  mes: string | null;
  atuacao: string | null;
  acao: string | null;
  geom: any | null;
  history: AcaoUpdate[];
};

// --- O Hook ---
export const useAcaoHistory = (acaoId: string | number | undefined | null) => {
  const [dossie, setDossie] = useState<AcaoDossie | null>(null);
  const [isLoading, setLoading] = useState(true); // Começa como true
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!acaoId) {
      setDossie(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/acoes/${acaoId}`);
      const responseData = await res.json();

      if (responseData.success) {
        setDossie(responseData.data);
      } else {
        setError(responseData.error?.message || 'Erro desconhecido');
        setDossie(null);
      }
    } catch (e: any) {
      console.error("Falha na chamada da API:", e);
      setError("Não foi possível conectar à API.");
      setDossie(null);
    } finally {
      setLoading(false);
    }
  }, [acaoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { dossie, isLoading, error, refetch: fetchData };
};