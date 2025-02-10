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

type MapContextType = {
  mapData: MapData | null
  actionsData: ActionsData | null
  isLoading: boolean
  error: string | null
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [mapData, setMapData] = useState<MapData | null>(null)
  const [actionsData, setActionsData] = useState<ActionsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return <MapContext.Provider value={{ mapData, actionsData, isLoading, error }}>{children}</MapContext.Provider>
}

export function useMapContext() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error("useMapContext must be used within a MapProvider")
  }
  return context
}

