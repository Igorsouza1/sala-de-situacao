"use client"

import { useState, useEffect, useRef } from "react"
import type { ReactNode } from "react"
import {
  Info,
  Ruler,
  Map as MapIcon,
  Tag,
  Flame,
  AlertTriangle,
  Loader2,
  TrendingDown,
  TrendingUp,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface PropertyBasic {
  nome?: string
  cod_imovel?: string
  municipio?: string
  num_area?: number
}

interface DossieData {
  nome: string
  cod_imovel: string
  municipio: string
  num_area: number
  focosCount: number
  desmatamentoCount: number
  acoes: Array<{ carater?: string }>
}

interface PropertyInfoControlProps {
  isActive: boolean
  onToggle: () => void
  hoveredPropertyId: number | null
  hoveredPropertyBasic: PropertyBasic | null
}

export function PropertyInfoControl({
  isActive,
  onToggle,
  hoveredPropertyId,
  hoveredPropertyBasic,
}: PropertyInfoControlProps) {
  const [dossie, setDossie] = useState<DossieData | null>(null)
  const [loading, setLoading] = useState(false)
  const currentIdRef = useRef<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isActive || !hoveredPropertyId) {
      setDossie(null)
      setLoading(false)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      currentIdRef.current = hoveredPropertyId
      setLoading(true)
      try {
        const res = await fetch(`/api/propriedades/${hoveredPropertyId}/dossie`)
        const json = await res.json()
        if (currentIdRef.current === hoveredPropertyId && json.success) {
          setDossie(json.data)
        }
      } catch {
        // ignore fetch errors in hover mode
      } finally {
        if (currentIdRef.current === hoveredPropertyId) setLoading(false)
      }
    }, 350)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [isActive, hoveredPropertyId])

  const nome = dossie?.nome || hoveredPropertyBasic?.nome
  const area = dossie?.num_area ?? hoveredPropertyBasic?.num_area
  const municipio = dossie?.municipio || hoveredPropertyBasic?.municipio
  const car = dossie?.cod_imovel || hoveredPropertyBasic?.cod_imovel
  const acoesTotal = dossie?.acoes?.length ?? 0
  const acoesPassivas =
    dossie?.acoes?.filter((a) =>
      a.carater?.toLowerCase().includes("passiv")
    ).length ?? 0
  const acoesAtivas =
    dossie?.acoes?.filter(
      (a) =>
        a.carater?.toLowerCase().includes("ativ") &&
        !a.carater?.toLowerCase().includes("passiv")
    ).length ?? 0

  return (
    <div className="relative z-[1000]">
      {/* Toggle button — same style as FilterPopover / CoordinateInspector */}
      <Button
        variant={isActive ? "default" : "outline"}
        size="icon"
        onClick={onToggle}
        className={`shadow-md w-10 h-10 rounded-full transition-all duration-200 ${
          isActive
            ? "bg-slate-700 text-white border-slate-700 hover:bg-slate-800"
            : "bg-white text-slate-700 hover:bg-gray-100 border-input"
        }`}
        title={
          isActive
            ? "Desativar modo informação"
            : "Ativar modo informação de propriedade"
        }
      >
        <Info className="h-5 w-5" />
      </Button>

      {/* Info balloon — slides in from left, same origin as FilterPopover */}
      <div
        className={`absolute left-12 top-0 bg-white border border-slate-200 rounded-xl shadow-2xl w-72 transition-all duration-300 ease-out origin-left ${
          isActive
            ? "opacity-100 scale-100 translate-x-0"
            : "opacity-0 scale-95 -translate-x-2 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-slate-700 rounded-t-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-white/60 flex-shrink-0" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">
              Informações da Propriedade
            </span>
          </div>
        </div>

        {/* Body — fades between states */}
        <div
          className={`transition-opacity duration-200 ${
            loading && !hoveredPropertyBasic ? "opacity-50" : "opacity-100"
          }`}
        >
          {hoveredPropertyBasic ? (
            <div className="p-4 space-y-3">
              {/* Name */}
              <div className="flex items-start gap-2">
                <Home className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-bold text-slate-800 leading-snug">
                  {nome || "Propriedade"}
                </span>
              </div>

              {/* Basic fields */}
              <div className="space-y-2">
                {area != null && (
                  <InfoRow
                    icon={Ruler}
                    label="Área"
                    value={`${Number(area).toFixed(2)} ha`}
                  />
                )}
                {municipio && (
                  <InfoRow icon={MapIcon} label="Município" value={municipio} />
                )}
                {car && (
                  <InfoRow
                    icon={Tag}
                    label="CAR"
                    value={
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 break-all">
                        {car.length > 24 ? `...${car.slice(-22)}` : car}
                      </span>
                    }
                  />
                )}
              </div>

              {/* Stats section */}
              <div className="border-t border-slate-100 pt-3">
                {loading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Carregando estatísticas...</span>
                  </div>
                ) : dossie ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <StatBubble
                        icon={Flame}
                        label="Focos"
                        value={dossie.focosCount}
                        color="text-red-500"
                        bg="bg-red-50 border-red-100"
                      />
                      <StatBubble
                        icon={AlertTriangle}
                        label="Desmate"
                        value={dossie.desmatamentoCount}
                        color="text-amber-600"
                        bg="bg-amber-50 border-amber-100"
                      />
                      <StatBubble
                        icon={Tag}
                        label="Ações"
                        value={acoesTotal}
                        color="text-slate-600"
                        bg="bg-slate-50 border-slate-200"
                      />
                    </div>
                    {acoesTotal > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        <AcaoChip
                          icon={TrendingDown}
                          label="Passivo"
                          value={acoesPassivas}
                          color="text-red-600"
                          bg="bg-red-50 border-red-100"
                        />
                        <AcaoChip
                          icon={TrendingUp}
                          label="Ativo"
                          value={acoesAtivas}
                          color="text-emerald-600"
                          bg="bg-emerald-50 border-emerald-100"
                        />
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="px-4 py-8 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 mb-3">
                <Home className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Passe o mouse sobre uma propriedade no mapa para ver as
                informações
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
      <span className="text-slate-500 w-14 shrink-0">{label}:</span>
      <span className="text-slate-800 font-medium flex-1 min-w-0">{value}</span>
    </div>
  )
}

function StatBubble({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div className={`rounded-lg p-2.5 text-center border ${bg}`}>
      <Icon className={`h-3.5 w-3.5 ${color} mx-auto mb-1`} />
      <div className={`text-lg font-black ${color} leading-none`}>{value}</div>
      <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wide mt-0.5">
        {label}
      </div>
    </div>
  )
}

function AcaoChip({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bg}`}>
      <Icon className={`h-3.5 w-3.5 ${color} flex-shrink-0`} />
      <div>
        <div className="text-[9px] uppercase font-bold text-slate-500">{label}</div>
        <div className={`text-sm font-black leading-none ${color}`}>{value}</div>
      </div>
    </div>
  )
}
