"use client"

import { useEffect, useState } from "react"

const pendentes = new Map<string, Promise<unknown[]>>()

export function periodoHistorico(year: string) {
  return year === "todos" ? `Jan/2024–${new Date().getFullYear()}` : year
}

function carregar<T>(url: string): Promise<T[]> {
  let promise = pendentes.get(url)
  if (!promise) {
    promise = fetch(url)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Falha ao carregar dados")))
      .then((json) => json?.success ? json.data : Promise.reject(new Error("Falha ao carregar dados")))
      .finally(() => pendentes.delete(url))
    pendentes.set(url, promise)
  }
  return promise as Promise<T[]>
}

export function useHistorico<T>(path: string, year: string) {
  const url = `${path}?year=${year}`
  const [result, setResult] = useState<{ url: string; raw: T[]; error: string | null } | null>(null)

  useEffect(() => {
    let active = true
    carregar<T>(url)
      .then((raw) => {
        if (active) setResult({ url, raw, error: null })
      })
      .catch(() => {
        if (active) setResult({ url, raw: [], error: "Falha ao carregar dados" })
      })
    return () => { active = false }
  }, [url])

  return {
    raw: result?.url === url ? result.raw : [],
    loading: result?.url !== url,
    error: result?.url === url ? result.error : null,
  }
}
