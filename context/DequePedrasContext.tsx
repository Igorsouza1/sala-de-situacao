'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DequePedrasData {
  chuva: number;
  turbidezMax: number;
  turbidezMin: number;
  turbidezMedia: number;
}

interface DequePedrasContextType {
  dequePedrasData: Record<number, DequePedrasData[]>;
  filteredDequePedrasData: DequePedrasData[];
  isLoading: boolean;
  error: string | null;
  setSelectedYear: (year: string) => void;
  selectedYear: string;
}

const DequePedrasContext = createContext<DequePedrasContextType | undefined>(undefined);

export function DequePedrasProvider({ children }: { children: ReactNode }) {
  const [dequePedrasData, setDequePedrasData] = useState<Record<number, DequePedrasData[]>>({});
  const [filteredDequePedrasData, setFilteredDequePedrasData] = useState<DequePedrasData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("todos");

  useEffect(() => {
    async function fetchDequePedrasData() {
      try {
        const response = await fetch('/api/deque-pedras');
        if (!response.ok) {
          throw new Error('Falha ao buscar dados');
        }
        const data = await response.json();
        console.log(data.data);
        setDequePedrasData(data.data);
      } catch (err) {
        setError('Erro ao carregar dados do Deque de Pedras');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDequePedrasData();
  }, []);

  useEffect(() => {
    if (selectedYear === "todos") {
      const allYearsData = Object.values(dequePedrasData).reduce((acc, yearData) => {
        return acc.map((monthData, index) => ({
          chuva: monthData.chuva + (yearData[index]?.chuva || 0),
          turbidezMax: Math.max(monthData.turbidezMax, yearData[index]?.turbidezMax || 0),
          turbidezMin: Math.min(monthData.turbidezMin, yearData[index]?.turbidezMin || Infinity),
          turbidezMedia: monthData.turbidezMedia + (yearData[index]?.turbidezMedia || 0),
        }));
      }, Array(12).fill({ chuva: 0, turbidezMax: 0, turbidezMin: Infinity, turbidezMedia: 0 }));

      // Calcular a média da turbidezMedia para todos os anos
      allYearsData.forEach(monthData => {
        monthData.turbidezMedia /= Object.keys(dequePedrasData).length;
      });

      setFilteredDequePedrasData(allYearsData);
    } else {
      const yearNumber = parseInt(selectedYear, 10);
      setFilteredDequePedrasData(dequePedrasData[yearNumber] || []);
    }
  }, [selectedYear, dequePedrasData]);

  return (
    <DequePedrasContext.Provider value={{ dequePedrasData, filteredDequePedrasData, isLoading, error, setSelectedYear, selectedYear }}>
      {children}
    </DequePedrasContext.Provider>
  );
}

export function useDequePedras() {
  const context = useContext(DequePedrasContext);
  if (context === undefined) {
    throw new Error('useDequePedras must be used within a DequePedrasProvider');
  }
  return context;
}
