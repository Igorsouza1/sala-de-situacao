import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import {
  format,
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
import { FilterPopover } from "./FilterPopover"

interface DateFilterControlProps {
  onDateChange: (startDate: Date | null, endDate: Date | null) => void
}

export function DateFilterControl({ onDateChange }: DateFilterControlProps) {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [openCalendar, setOpenCalendar] = useState<"start" | "end" | null>(null)

  const didInitialize = useRef(false)

  useEffect(() => {
    if (!didInitialize.current) {
      const now = new Date()
      const start = startOfYear(now)
      const end = endOfYear(now)
      setStartDate(start)
      setEndDate(end)
      onDateChange(start, end)
      didInitialize.current = true
    }
  }, [onDateChange])

  const isFilterActive = startDate !== null || endDate !== null

  const applyPreset = (preset: "today" | "week" | "month" | "year") => {
    const now = new Date()
    let start: Date
    let end: Date
    switch (preset) {
      case "today":
        start = startOfDay(now); end = endOfDay(now); break
      case "week":
        start = startOfWeek(now, { locale: ptBR }); end = endOfWeek(now, { locale: ptBR }); break
      case "month":
        start = startOfMonth(now); end = endOfMonth(now); break
      case "year":
        start = startOfYear(now); end = endOfYear(now); break
    }
    setStartDate(start)
    setEndDate(end)
    onDateChange(start, end)
  }

  const applyYear = (year: number) => {
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31, 23, 59, 59, 999)
    setStartDate(start)
    setEndDate(end)
    onDateChange(start, end)
  }

  const handleApply = (close: () => void) => {
    onDateChange(startDate, endDate)
    close()
  }

  const handleClear = (close: () => void) => {
    setStartDate(null)
    setEndDate(null)
    setOpenCalendar(null)
    onDateChange(null, null)
    close()
  }

  return (
    <FilterPopover
      icon={CalendarIcon}
      title="Filtro de Datas"
      isActive={isFilterActive}
      panelClassName="w-72"
    >
      {(close) => (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {(["today", "week", "month", "year"] as const).map((preset) => (
              <Button
                key={preset}
                size="sm"
                variant="outline"
                className="text-xs h-8 text-slate-700"
                onClick={() => { applyPreset(preset); close() }}
              >
                {{ today: "Hoje", week: "Essa Semana", month: "Esse Mês", year: "Esse Ano" }[preset]}
              </Button>
            ))}
          </div>

          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">Histórico</p>
            <div className="grid grid-cols-5 gap-1">
              {[2026, 2025, 2024, 2023, 2022].map((year) => (
                <Button
                  key={year}
                  size="sm"
                  variant="outline"
                  className="text-xs px-1 h-8 text-slate-700"
                  onClick={() => { applyYear(year); close() }}
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">Período Customizado</p>
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left font-normal text-slate-700"
                onClick={() => setOpenCalendar(openCalendar === "start" ? null : "start")}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                {startDate ? format(startDate, "dd/MM/yyyy") : <span className="text-slate-400">Data inicial</span>}
              </Button>
              {openCalendar === "start" && (
                <Calendar
                  selected={startDate}
                  onChange={(date) => { setStartDate(date); setOpenCalendar(null) }}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left font-normal text-slate-700"
                onClick={() => setOpenCalendar(openCalendar === "end" ? null : "end")}
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                {endDate ? format(endDate, "dd/MM/yyyy") : <span className="text-slate-400">Data final</span>}
              </Button>
              {openCalendar === "end" && (
                <Calendar
                  selected={endDate}
                  onChange={(date) => { setEndDate(date); setOpenCalendar(null) }}
                />
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-1 border-t border-slate-100">
            <Button
              size="sm"
              className="flex-1 bg-brand-primary hover:bg-blue-600 text-white"
              onClick={() => handleApply(close)}
            >
              Aplicar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-slate-600"
              onClick={() => handleClear(close)}
            >
              Limpar
            </Button>
          </div>
        </div>
      )}
    </FilterPopover>
  )
}
