'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RegiaoContextType {
  selectedRegionId: number | null;
  setSelectedRegionId: (id: number | null) => void;
}

const RegiaoContext = createContext<RegiaoContextType | undefined>(undefined);

export const RegiaoProvider = ({ children }: { children: ReactNode }) => {
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

  return (
    <RegiaoContext.Provider value={{ selectedRegionId, setSelectedRegionId }}>
      {children}
    </RegiaoContext.Provider>
  );
};

export const useRegiao = () => {
  const context = useContext(RegiaoContext);
  if (context === undefined) {
    throw new Error('useRegiao must be used within a RegiaoProvider');
  }
  return context;
};
