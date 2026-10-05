"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import {
  format,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

// Período aplica na hora (DESIGN.md 2.2: cada etapa é um custo) e o botão escolhido fica marcado,
// para a pessoa ver o que está valendo sem comparar datas de cabeça.

type Range = [Date, Date]

const PRESETS: { label: string; range: (now: Date) => Range }[] = [
  { label: "Hoje", range: (n) => [startOfDay(n), endOfDay(n)] },
  { label: "Esta semana", range: (n) => [startOfWeek(n, { locale: ptBR }), endOfWeek(n, { locale: ptBR })] },
  { label: "Este mês", range: (n) => [startOfMonth(n), endOfMonth(n)] },
]

const yearRange = (year: number): Range => [new Date(year, 0, 1), new Date(year, 11, 31, 23, 59, 59, 999)]

interface DateFilterControlProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (startDate: Date | null, endDate: Date | null) => void
}

export function DateFilterControl({ startDate, endDate, onChange }: DateFilterControlProps) {
  const [openCalendar, setOpenCalendar] = useState<"start" | "end" | null>(null)

  const now = new Date()
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)
  const matches = ([s, e]: Range) => !!startDate && !!endDate && isSameDay(startDate, s) && isSameDay(endDate, e)
  const choose = ([s, e]: Range) => { setOpenCalendar(null); onChange(s, e) }
  const choice = (selected: boolean) =>
    cn("h-8 px-1 text-xs", selected && "border-primary bg-secondary text-secondary-foreground")

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {PRESETS.map((p) => {
          const range = p.range(now)
          return (
            <Button key={p.label} size="sm" variant="outline" aria-pressed={matches(range)} className={choice(matches(range))} onClick={() => choose(range)}>
              {p.label}
            </Button>
          )
        })}
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {years.map((year) => {
          const range = yearRange(year)
          return (
            <Button key={year} size="sm" variant="outline" aria-pressed={matches(range)} className={cn(choice(matches(range)), "font-mono tabular-nums")} onClick={() => choose(range)}>
              {year}
            </Button>
          )
        })}
      </div>

      <div className="space-y-1">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-left font-normal"
          onClick={() => setOpenCalendar(openCalendar === "start" ? null : "start")}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
          {startDate ? <span className="font-mono tabular-nums">{format(startDate, "dd/MM/yyyy")}</span> : <span className="text-muted-foreground">Data inicial</span>}
        </Button>
        {openCalendar === "start" && (
          <Calendar selected={startDate} onChange={(date) => { setOpenCalendar(null); onChange(date, endDate) }} />
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-left font-normal"
          onClick={() => setOpenCalendar(openCalendar === "end" ? null : "end")}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
          {endDate ? <span className="font-mono tabular-nums">{format(endDate, "dd/MM/yyyy")}</span> : <span className="text-muted-foreground">Data final</span>}
        </Button>
        {openCalendar === "end" && (
          <Calendar selected={endDate} onChange={(date) => { setOpenCalendar(null); onChange(startDate, date) }} />
        )}
      </div>
    </div>
  )
}
