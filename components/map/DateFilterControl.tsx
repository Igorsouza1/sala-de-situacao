import { useState, useCallback } from "react"
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
    <Card className="bg-pantaneiro-green text-primary-foreground shadow-lg w-auto max-w-[300px] rounded-lg overflow-hidden">
      <CardContent className="p-0">
        <Button
          variant="ghost"
          onClick={toggleExpand}
          className="w-full h-12 px-4 py-2 flex items-center justify-between text-primary-foreground hover:bg-pantaneiro-lime hover:text-primary-foreground transition-colors duration-200"
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
          <div className="p-4 bg-background text-foreground">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={() => applyPresetFilter("today")} className="text-xs">
                Hoje
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyPresetFilter("week")} className="text-xs">
                Essa Semana
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyPresetFilter("month")} className="text-xs">
                Esse Mês
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyPresetFilter("year")} className="text-xs">
                Esse Ano
              </Button>
            </div>
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Data inicial</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar selected={startDate} onChange={setStartDate} />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Data final</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar selected={endDate} onChange={setEndDate} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button
                onClick={handleApplyFilter}
                className="flex-1 bg-pantaneiro-green hover:bg-pantaneiro-lime text-primary-foreground"
              >
                Aplicar
              </Button>
              <Button onClick={handleClearFilter} variant="outline" className="flex-1">
                Limpar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

