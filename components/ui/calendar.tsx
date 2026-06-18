"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export interface CalendarProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  className?: string
}

function Calendar({ selected, onChange, className }: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      selected={selected ?? undefined}
      onSelect={(date) => onChange(date ?? null)}
      showOutsideDays
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col",
        month: "flex flex-col gap-3",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-slate-700",
        nav: "flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-slate-400 w-9 font-normal text-[0.8rem] text-center pb-1",
        week: "flex w-full",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal aria-selected:opacity-100"
        ),
        selected:
          "bg-brand-primary text-white rounded-md hover:bg-blue-600 hover:text-white focus:bg-brand-primary focus:text-white",
        today: "bg-slate-100 text-slate-900 rounded-md",
        outside: "text-slate-300 opacity-50",
        disabled: "text-slate-300 opacity-50",
        hidden: "invisible",
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
