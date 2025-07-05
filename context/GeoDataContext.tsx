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

type ModalData = {
  isOpen: boolean
  title: string
  content: React.ReactNode
}

type ExpedicoesData = {
  trilhas: GeoJSONFeatureCollection
  waypoints: GeoJSONFeatureCollection
}

type AcoesData = Record<string, GeoJSONFeatureCollection>

type MapContextType = {
  mapData: MapData | null
  expedicoesData: ExpedicoesData | null
  acoesData: AcoesData | null
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
  const [expedicoesData, setExpedicoesData] = useState<ExpedicoesData | null>(null)
  const [acoesData, setAcoesData] = useState<AcoesData | null>(null)
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
    fetchExpedicoesData()
    fetchAcoesData()
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
    } finally {
      setIsLoading(false)
    }
  }

  const fetchExpedicoesData = async () => {
    try {
      const response = await fetch("/api/map/expedicoes")
      if (!response.ok) {
        throw new Error("Failed to fetch expeditions data")
      }
      const data = await response.json()
      setExpedicoesData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    }
  }

  const fetchAcoesData = async () => {
    try {
      const response = await fetch("/api/map/acao")
      if (!response.ok) {
        throw new Error("Failed to fetch actions data")
      }
      const data = await response.json()
      setAcoesData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
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
        isLoading,
        expedicoesData,
        acoesData,
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