"use client"

import { useState } from "react"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { format, isSameDay } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Collapse } from "@/components/ui/collapse"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { DATE_PRESETS, yearRange, type DateRange } from "./helpers/filters"

// Período aplica na hora (DESIGN.md 2.2: cada etapa é um custo) e o escolhido fica marcado, para a pessoa ver o que
// está valendo sem comparar datas de cabeça. Os atalhos cobrem o caso comum; anos antigos e datas livres vêm um passo
// adiante. O seletor de ano e os calendários são os componentes do projeto (e não o seletor nativo do navegador), para abrir com
// o mesmo estilo e o mesmo movimento do resto (8.1). Ficam acima do painel do dock (z-[1200]), que usa z-[1000].

const selectedClass = "border-primary bg-secondary text-secondary-foreground"

function DateButton({ value, placeholder, label, onChange }: { value: Date | null; placeholder: string; label: string; onChange: (d: Date | null) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" aria-label={label} className="h-9 min-w-0 justify-start gap-2 px-2.5 font-normal">
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          {value ? <span className="truncate font-mono text-xs tabular-nums">{format(value, "dd/MM/yyyy")}</span> : <span className="text-xs text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[1200] w-auto p-0">
        <Calendar selected={value} onChange={(d) => { setOpen(false); onChange(d) }} />
      </PopoverContent>
    </Popover>
  )
}

interface DateFilterControlProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (startDate: Date | null, endDate: Date | null) => void
}

export function DateFilterControl({ startDate, endDate, onChange }: DateFilterControlProps) {
  const [datesOpen, setDatesOpen] = useState(false)

  const now = new Date()
  const pastYears = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 - i)
  const matches = ([s, e]: DateRange) => !!startDate && !!endDate && isSameDay(startDate, s) && isSameDay(endDate, e)
  const matchedYear = pastYears.find((y) => matches(yearRange(y)))
  const choose = ([s, e]: DateRange) => onChange(s, e)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {DATE_PRESETS.map((p) => {
          const range = p.range(now)
          const selected = matches(range)
          return (
            <Button key={p.id} size="sm" variant="outline" aria-pressed={selected} aria-label={p.label} title={p.label} className={cn("h-9 min-w-0 px-1 text-xs", selected && selectedClass)} onClick={() => choose(range)}>
              {p.short}
            </Button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select value={matchedYear ? String(matchedYear) : ""} onValueChange={(y) => choose(yearRange(Number(y)))}>
          <SelectTrigger aria-label="Escolher outro ano" className={cn("h-9 text-xs", matchedYear && selectedClass)}>
            <SelectValue placeholder="Outro ano" />
          </SelectTrigger>
          <SelectContent className="z-[1200]">
            {pastYears.map((y) => <SelectItem key={y} value={String(y)} className="font-mono tabular-nums">{y}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" aria-expanded={datesOpen} className="h-9 justify-between px-3 text-xs" onClick={() => setDatesOpen((v) => !v)}>
          Escolher datas
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-[320ms] ease-out", datesOpen && "rotate-180")} aria-hidden />
        </Button>
      </div>

      <Collapse open={datesOpen}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1">
          <DateButton value={startDate} placeholder="Início" label="Data inicial" onChange={(d) => onChange(d, endDate)} />
          <span className="text-xs text-muted-foreground">até</span>
          <DateButton value={endDate} placeholder="Fim" label="Data final" onChange={(d) => onChange(startDate, d)} />
        </div>
      </Collapse>
    </div>
  )
}
