"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type GeoJSONFeature = {
  type: "Feature"
  properties: {
    id: number
    nome: string
    tipo: string
    codigo: string
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

type MapContextType = {
  estradas: GeoJSONFeatureCollection | null
  isLoading: boolean
  error: string | null
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [estradas, setEstradas] = useState<GeoJSONFeatureCollection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMapData()
  }, [])

  const fetchMapData = async () => {
    try {
      const response = await fetch("/api/map")
      if (!response.ok) {
        throw new Error("Failed to fetch map data")
      }
      const data = await response.json()
      setEstradas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return <MapContext.Provider value={{ estradas, isLoading, error }}>{children}</MapContext.Provider>
}

export function useMapContext() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error("useMapContext must be used within a MapProvider")
  }
  return context
}

