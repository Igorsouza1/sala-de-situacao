"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type GeoJSONFeature = {
  type: "Feature"
  properties: {
    [key: string]: any
  }
  geometry: {
    type: string
    coordinates: number[] | number[][] | number[][][]
  }
}

type GeoJSONFeatureCollection = {
  type: "FeatureCollection"
  features: GeoJSONFeature[]
}

type MapData = {
  estradas: GeoJSONFeatureCollection
  bacia: GeoJSONFeatureCollection
  leito: GeoJSONFeatureCollection
  desmatamento: GeoJSONFeatureCollection
  propriedades: GeoJSONFeatureCollection
  firms: GeoJSONFeatureCollection
  banhado: GeoJSONFeatureCollection
}

type ActionsData = {
  [key: string]: GeoJSONFeatureCollection
}

type ModalData = {
  isOpen: boolean
  title: string
  content: React.ReactNode
}

type MapContextType = {
  mapData: MapData | null
  actionsData: ActionsData | null
  isLoading: boolean
  error: string | null
  modalData: ModalData
  openModal: (title: string, content: React.ReactNode) => void
  closeModal: () => void
  dateFilter: { startDate: Date | null; endDate: Date | null }
  setDateFilter: (startDate: Date | null, endDate: Date | null) => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [mapData, setMapData] = useState<MapData | null>(null)
  const [actionsData, setActionsData] = useState<ActionsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalData, setModalData] = useState<ModalData>({
    isOpen: false,
    title: "",
    content: null,
  })
  const [dateFilter, setDateFilter] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null,
  })

  useEffect(() => {
    fetchMapData()
    fetchActionsData()
  }, [])

  const fetchMapData = async () => {
    try {
      const response = await fetch("/api/map")
      if (!response.ok) {
        throw new Error("Failed to fetch map data")
      }
      const data = await response.json()
      console.log(data)
      setMapData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    }
  }

  const fetchActionsData = async () => {
    try {
      const response = await fetch("/api/map/acao")
      if (!response.ok) {
        throw new Error("Failed to fetch actions data")
      }
      const data = await response.json()
      setActionsData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

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
        mapData,
        actionsData,
        isLoading,
        error,
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
  return context
}

