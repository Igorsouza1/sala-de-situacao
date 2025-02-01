import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface YearFilterProps {
  selectedYear: string
  onYearChange: (year: string) => void
}

export function YearFilter({ selectedYear, onYearChange }: YearFilterProps) {
  const years = ['all', '2023', '2022', '2021', '2020']

  return (
    <Select value={selectedYear} onValueChange={onYearChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Selecione o ano" />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={year}>
            {year === 'all' ? 'Todos os anos' : year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
