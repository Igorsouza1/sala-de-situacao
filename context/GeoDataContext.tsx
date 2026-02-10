"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"



type ModalData = {
  isOpen: boolean
  title: string
  content: React.ReactNode
}

// Legacy Data Types (MapData, ExpedicoesData, AcoesData) Removed

type MapContextType = {
  modalData: ModalData
  openModal: (title: string, content: React.ReactNode) => void
  closeModal: () => void
  dateFilter: { startDate: Date | null; endDate: Date | null }
  setDateFilter: (startDate: Date | null, endDate: Date | null) => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: React.ReactNode }) {
  // Legacy Data State Removed
  
  const [modalData, setModalData] = useState<ModalData>({
    isOpen: false,
    title: "",
    content: null,
  })
  const [dateFilter, setDateFilter] = useState<{ startDate: Date | null; endDate: Date | null }>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { startDate: start, endDate: end };
  })

  // Legacy Fetch Functions Removed


  const openModal = (title: string, content: React.ReactNode) => {
    setModalData({ isOpen: true, title, content })
  }

  const closeModal = () => {
    setModalData({ isOpen: false, title: "", content: null })
  }

  const setDateFilterFunction = (startDate: Date | null, endDate: Date | null) => {
    setDateFilter({ startDate, endDate })
  }

  return (
    <MapContext.Provider
      value={{
        modalData,
        openModal,
        closeModal,
        dateFilter,
        setDateFilter: setDateFilterFunction,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export function useMapContext() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error("useMapContext must be used within a MapProvider")
  }
  return context}