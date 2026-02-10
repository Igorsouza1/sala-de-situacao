import { useState, useCallback, useEffect, useRef  } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronDownIcon } from "lucide-react"
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
import { cn } from "@/lib/utils"

interface DateFilterControlProps {
  onDateChange: (startDate: Date | null, endDate: Date | null) => void
}

export function DateFilterControl({ onDateChange }: DateFilterControlProps) {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const didInitialize = useRef(false) // ← 🔑 controle de inicialização

  useEffect(() => {
    if (!didInitialize.current) {
      const now = new Date()
      const start = startOfMonth(now)
      const end = endOfMonth(now)

      setStartDate(start)
      setEndDate(end)
      onDateChange(start, end)
      didInitialize.current = true
    }
  }, [onDateChange])
  const handleApplyFilter = useCallback(() => {
    onDateChange(startDate, endDate)
    setIsExpanded(false)
  }, [startDate, endDate, onDateChange])

  const handleClearFilter = useCallback(() => {
    setStartDate(null)
    setEndDate(null)
    onDateChange(null, null)
    setIsExpanded(false)
  }, [onDateChange])

  const toggleExpand = () => setIsExpanded(!isExpanded)

  const applyPresetFilter = (preset: "today" | "week" | "month" | "year") => {
    const now = new Date()
    let start: Date
    let end: Date

    switch (preset) {
      case "today":
        start = startOfDay(now)
        end = endOfDay(now)
        break
      case "week":
        start = startOfWeek(now, { locale: ptBR })
        end = endOfWeek(now, { locale: ptBR })
        break
      case "month":
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case "year":
        start = startOfYear(now)
        end = endOfYear(now)
        break
    }

    setStartDate(start)
    setEndDate(end)
    onDateChange(start, end)
    setIsExpanded(false)
  }

  return (
    <Card className="bg-brand-dark/95 border border-white/10 text-slate-200 shadow-xl w-auto max-w-[300px] rounded-xl overflow-hidden backdrop-blur-sm">
      <CardContent className="p-0">
        <Button
          variant="ghost"
          onClick={toggleExpand}
          className="w-full h-12 px-4 py-2 flex items-center justify-between text-slate-200 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors duration-200"
        >
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            <span className="font-semibold">
              {startDate && endDate
                ? `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`
                : "Filtrar por data"}
            </span>
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "transform rotate-180" : ""}`}
          />
        </Button>
        {isExpanded && (
          <div className="p-4 bg-brand-dark  border-t border-white/5">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={() => applyPresetFilter("today")} className="text-xs border-white/10 bg-transparent text-slate-300 hover:bg-brand-primary/20 hover:text-white hover:border-brand-primary/50">
                Hoje
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyPresetFilter("week")} className="text-xs border-white/10 bg-transparent text-slate-300 hover:bg-brand-primary/20 hover:text-white hover:border-brand-primary/50">
                Essa Semana
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyPresetFilter("month")} className="text-xs border-white/10 bg-transparent text-slate-300 hover:bg-brand-primary/20 hover:text-white hover:border-brand-primary/50">
                Esse Mês
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyPresetFilter("year")} className="text-xs border-white/10 bg-transparent text-slate-300 hover:bg-brand-primary/20 hover:text-white hover:border-brand-primary/50">
                Esse Ano
              </Button>
            </div>
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white", !startDate && "text-slate-400")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Data inicial</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-brand-dark border-white/10 text-slate-200" align="start">
                  <Calendar selected={startDate} onChange={setStartDate} className="bg-brand-dark text-slate-200" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white", !endDate && "text-slate-400")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Data final</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-brand-dark border-white/10 text-slate-200" align="start">
                  <Calendar selected={endDate} onChange={setEndDate} className="bg-brand-dark text-slate-200" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button
                onClick={handleApplyFilter}
                className="flex-1 bg-brand-primary hover:bg-blue-600 text-white border-0"
              >
                Aplicar
              </Button>
              <Button onClick={handleClearFilter} variant="outline" className="flex-1 border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white">
                Limpar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

