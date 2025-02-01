"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { db } from "../db"
import * as schema from "@/db/schema"

interface GeoData {
  shapes: any[]
  acoes: any[]
  desmatamento: any[]
  rawFirms: any[]
}

interface GeoDataContextType {
  geoData: GeoData | null
  loading: boolean
  error: Error | null
}

const GeoDataContext = createContext<GeoDataContextType | undefined>(undefined)

export const useGeoData = () => {
  const context = useContext(GeoDataContext)
  if (context === undefined) {
    throw new Error("useGeoData must be used within a GeoDataProvider")
  }
  return context
}

export const GeoDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [geoData, setGeoData] = useState<GeoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          shapes,
          acoesData,
          desmatamentoData,
          rawFirmsData,
        ] = await Promise.all([
          db.select().from(schema.shapes),
          db.select().from(schema.acoes),
          db.select().from(schema.desmatamento),
          db.select().from(schema.deque_de_pedras),
          db.select().from(schema.fireDetections),
        ])

        setGeoData({
          shapes: shapes,
          acoes: acoesData,
          desmatamento: desmatamentoData,
          rawFirms: rawFirmsData,
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return <GeoDataContext.Provider value={{ geoData, loading, error }}>{children}</GeoDataContext.Provider>
}

