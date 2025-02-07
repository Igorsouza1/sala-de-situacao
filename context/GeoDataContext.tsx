"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type GeometryType = {
  type: string
  coordinates: number[] | number[][] | number[][][]
}

type ShapeType = {
  id: number | string
  geometry: GeometryType
}

type ShapeGroupType = {
  [category: string]: ShapeType[]
}

type ActionType = {
  id: number
  geometry: GeometryType
}

type ActionsGroupType = {
  [category: string]: ActionType[]
}

type MapContextType = {
  shapes: ShapeGroupType
  actions: ActionsGroupType
  isLoading: boolean
  error: string | null
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [shapes, setShapes] = useState<ShapeGroupType>({})
  const [actions, setActions] = useState<ActionsGroupType>({})
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
      setShapes(data)
      setActions(data.actions)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return <MapContext.Provider value={{ shapes, actions, isLoading, error }}>{children}</MapContext.Provider>
}

export function useMapContext() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error("useMapContext must be used within a MapProvider")
  }
  return context
}

