"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import type { AreaFilter } from "./helpers/filters"

// Tamanho da propriedade aplica sozinho, um instante depois da última tecla (DESIGN.md 2.2),
// e a contagem mostra na hora o que o filtro deixou.

interface PropertyFilterControlProps {
  value: AreaFilter
  onChange: (filter: AreaFilter) => void
}

const toText = (n?: number) => (n === undefined ? "" : String(n))
const toNumber = (t: string) => (t.trim() === "" || Number.isNaN(parseFloat(t)) ? undefined : parseFloat(t))

export function PropertyFilterControl({ value, onChange }: PropertyFilterControlProps) {
  const [min, setMin] = useState(toText(value.minArea))
  const [max, setMax] = useState(toText(value.maxArea))
  const [count, setCount] = useState<number | null>(null)
  const lastRequest = useRef(0)

  // quem está de fora (Limpar tudo) pode mudar o filtro: os campos acompanham
  useEffect(() => {
    if (toNumber(min) !== value.minArea) setMin(toText(value.minArea))
    if (toNumber(max) !== value.maxArea) setMax(toText(value.maxArea))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.minArea, value.maxArea])

  // digitou e parou: aplica e conta
  useEffect(() => {
    const minArea = toNumber(min)
    const maxArea = toNumber(max)
    if (minArea === value.minArea && maxArea === value.maxArea) return
    const t = setTimeout(async () => {
      onChange({ minArea, maxArea })
      if (minArea === undefined && maxArea === undefined) { setCount(null); return }
      const id = ++lastRequest.current
      const params = new URLSearchParams()
      if (minArea !== undefined) params.append("minArea", String(minArea))
      if (maxArea !== undefined) params.append("maxArea", String(maxArea))
      try {
        const res = await fetch(`/api/map/propriedades/count?${params}`)
        const data = await res.json()
        if (id === lastRequest.current) setCount(data.count ?? null)
      } catch {
        if (id === lastRequest.current) setCount(null)
      }
    }, 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max])

  return (
    <div className="space-y-3">
      {/* lê-se como o filtro que é: "Área de [mínimo] a [máximo] ha" — sem título extra para decifrar */}
      <div className="flex items-center gap-2 text-sm">
        <span className="shrink-0">Área de</span>
        <Input type="number" min="0" inputMode="decimal" placeholder="Mínimo" aria-label="Área mínima, em hectares" value={min} onChange={(e) => setMin(e.target.value)} className="h-9 min-w-0 flex-1 px-2.5 text-sm" />
        <span className="shrink-0">a</span>
        <Input type="number" min="0" inputMode="decimal" placeholder="Máximo" aria-label="Área máxima, em hectares" value={max} onChange={(e) => setMax(e.target.value)} className="h-9 min-w-0 flex-1 px-2.5 text-sm" />
        <abbr title="hectares" className="shrink-0 no-underline">ha</abbr>
      </div>
      {count != null && (
        <p role="status" className="text-sm text-muted-foreground">
          <span className="font-mono font-semibold tabular-nums text-foreground">{count}</span> propriedade{count !== 1 ? "s" : ""} encontrada{count !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}
