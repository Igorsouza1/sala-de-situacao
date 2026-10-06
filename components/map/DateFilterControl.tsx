"use client"

import { useState } from "react"
import { CalendarIcon, ChevronDown, ChevronUp } from "lucide-react"
import {
  format,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

// Período aplica na hora (DESIGN.md 2.2: cada etapa é um custo) e o escolhido fica marcado, para a pessoa ver o que
// está valendo sem comparar datas de cabeça. Compacto de propósito: o painel Filtros também precisa mostrar o tamanho
// das propriedades sem rolar (13.1). Anos antigos e datas livres ficam um passo adiante, porque são o caso raro.

type Range = [Date, Date]

const PRESETS: { label: string; range: (now: Date) => Range }[] = [
  { label: "Hoje", range: (n) => [startOfDay(n), endOfDay(n)] },
  { label: "Esta semana", range: (n) => [startOfWeek(n, { locale: ptBR }), endOfWeek(n, { locale: ptBR })] },
  { label: "Este mês", range: (n) => [startOfMonth(n), endOfMonth(n)] },
  { label: "Este ano", range: (n) => [startOfYear(n), endOfYear(n)] },
]

const yearRange = (year: number): Range => [new Date(year, 0, 1), new Date(year, 11, 31, 23, 59, 59, 999)]

interface DateFilterControlProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (startDate: Date | null, endDate: Date | null) => void
}

export function DateFilterControl({ startDate, endDate, onChange }: DateFilterControlProps) {
  const [openCalendar, setOpenCalendar] = useState<"start" | "end" | null>(null)
  const [datesOpen, setDatesOpen] = useState(false)

  const now = new Date()
  const pastYears = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 - i)
  const matches = ([s, e]: Range) => !!startDate && !!endDate && isSameDay(startDate, s) && isSameDay(endDate, e)
  const choose = ([s, e]: Range) => { setOpenCalendar(null); onChange(s, e) }
  const matchedYear = pastYears.find((y) => matches(yearRange(y)))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const range = p.range(now)
          const selected = matches(range)
          return (
            <Button
              key={p.label}
              size="sm"
              variant="outline"
              aria-pressed={selected}
              className={cn("h-8 px-2.5 text-xs", selected && "border-primary bg-secondary text-secondary-foreground")}
              onClick={() => choose(range)}
            >
              {p.label}
            </Button>
          )
        })}
      </div>

      {/* seletor nativo: uma lista de anos não precisa de cinco botões */}
      <select
        aria-label="Escolher outro ano"
        value={matchedYear ?? ""}
        onChange={(e) => e.target.value && choose(yearRange(Number(e.target.value)))}
        className={cn(
          "h-8 w-full rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30",
          matchedYear && "border-primary bg-secondary text-secondary-foreground",
        )}
      >
        <option value="">Outro ano</option>
        {pastYears.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>

      <button
        type="button"
        aria-expanded={datesOpen}
        onClick={() => setDatesOpen((v) => !v)}
        className="flex h-8 w-full items-center justify-between rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors duration-180 hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
      >
        <span className="flex items-center gap-2"><CalendarIcon className="h-3.5 w-3.5" aria-hidden />Escolher datas…</span>
        {datesOpen ? <ChevronUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
      </button>

      {datesOpen && (
        <div className="space-y-1">
          <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal" onClick={() => setOpenCalendar(openCalendar === "start" ? null : "start")}>
            <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
            {startDate ? <span className="font-mono tabular-nums">{format(startDate, "dd/MM/yyyy")}</span> : <span className="text-muted-foreground">Data inicial</span>}
          </Button>
          {openCalendar === "start" && <Calendar selected={startDate} onChange={(date) => { setOpenCalendar(null); onChange(date, endDate) }} />}
          <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal" onClick={() => setOpenCalendar(openCalendar === "end" ? null : "end")}>
            <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
            {endDate ? <span className="font-mono tabular-nums">{format(endDate, "dd/MM/yyyy")}</span> : <span className="text-muted-foreground">Data final</span>}
          </Button>
          {openCalendar === "end" && <Calendar selected={endDate} onChange={(date) => { setOpenCalendar(null); onChange(startDate, date) }} />}
        </div>
      )}
    </div>
  )
}
