"use client"

import { useCallback, useEffect, useState } from "react"

// Uma leitura da API com os três estados que a tela precisa dizer (DESIGN.md 2.1): carregando, pronto e erro com saída.
export interface Carga<T> {
  estado: "carregando" | "pronto" | "erro"
  data: T | null
  tentar: () => void
}

export function useJson<T>(url: string): Carga<T> {
  const [estado, setEstado] = useState<Carga<T>["estado"]>("carregando")
  const [data, setData] = useState<T | null>(null)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let vivo = true
    setEstado("carregando")
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (!vivo) return
        if (!json?.success) throw new Error("sem dados")
        setData(json.data as T)
        setEstado("pronto")
      })
      .catch(() => {
        if (!vivo) return
        setData(null)
        setEstado("erro")
      })
    return () => { vivo = false }
  }, [url, tentativa])

  const tentar = useCallback(() => setTentativa((n) => n + 1), [])
  return { estado, data, tentar }
}
