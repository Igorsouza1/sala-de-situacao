"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"

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

// Uma consulta por endereço, mesmo que dois componentes (ou o Strict Mode em desenvolvimento) peçam ao mesmo tempo.
const emAndamento = new Map<string, Promise<RegionProfile | null>>()

function carregarRegiao(url: string): Promise<RegionProfile | null> {
  let p = emAndamento.get(url)
  if (!p) {
    p = fetch(url)
      .then((res) => (res.ok ? (res.json() as Promise<RegionProfile | null>) : null))
      .catch(() => null)
      .finally(() => emAndamento.delete(url))
    emAndamento.set(url, p)
  }
  return p
}

// Quem navega para uma região específica (`?regiao_id=`) vê o perfil dela; sem o parâmetro, o conjunto das regiões da pessoa.
// O mapa usa este mesmo perfil para enquadrar a câmera: um pedido só para os dois.
export function RegionProvider({ children }: { children: ReactNode }) {
  const regiaoId = useSearchParams().get("regiao_id")
  const url = regiaoId ? `/api/map/region?regiao_id=${encodeURIComponent(regiaoId)}` : "/api/map/region"
  const [region, setRegion] = useState<RegionProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setRegion(null)
    setLoading(true)
    carregarRegiao(url).then((data) => {
      if (cancelled) return
      setRegion(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [url])

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
