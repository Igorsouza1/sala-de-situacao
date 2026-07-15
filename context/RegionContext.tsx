"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

/**
 * Perfil da Região do usuário logado — identidade exibida na UI
 * (nome, município/UF, brasão) e enquadramento do mapa (center/bbox).
 * Fonte: /api/map/region (nome/geom de `regioes` + `metadata.identity`).
 * Substitui os antigos hardcodes "Rio da Prata" / "Bonito/MS".
 */
export interface RegionProfile {
  nome: string | null
  municipio: string | null
  uf: string | null
  brasaoUrl: string | null
  center: [number, number]
  bbox: [number, number, number, number]
}

interface RegionContextValue {
  region: RegionProfile | null
  loading: boolean
}

const RegionContext = createContext<RegionContextValue>({ region: null, loading: true })

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegion] = useState<RegionProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/map/region")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setRegion(data ?? null)
      })
      .catch(() => {
        if (!cancelled) setRegion(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return <RegionContext.Provider value={{ region, loading }}>{children}</RegionContext.Provider>
}

export function useRegion(): RegionContextValue {
  return useContext(RegionContext)
}

/** "Município de Bonito/MS" → montado a partir do perfil; cai para o nome da Região. */
export function regionSubtitle(region: RegionProfile | null): string {
  if (region?.municipio) return `Município de ${region.municipio}${region.uf ? `/${region.uf}` : ""}`
  return region?.nome ?? ""
}
