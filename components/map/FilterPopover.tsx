"use client"

import { useState, ReactNode } from "react"
import { X, LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilterPopoverProps {
  icon: LucideIcon
  title: string
  count?: number | null
  children: (close: () => void) => ReactNode
}

export function FilterPopover({ icon: Icon, title, count, children }: FilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)

  const close = () => setIsOpen(false)

  return (
    <div className="relative z-[1000]">
      {/* Ícone principal circular */}
      <div className="relative inline-block">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-white hover:bg-gray-100 shadow-md text-slate-700 border-input rounded-full w-10 h-10 transition-colors ${
            isOpen ? "ring-2 ring-brand-primary ring-offset-2" : ""
          }`}
          title={title}
        >
          <Icon className="h-5 w-5" />
        </Button>
        {count != null && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-brand-primary text-white text-[10px] font-bold leading-none shadow">
            {count}
          </span>
        )}
      </div>

      {/* Painel de Filtro com Animação */}
      <div
        className={`absolute left-12 top-0 bg-white border border-slate-200 rounded-lg shadow-xl p-4 w-64 transition-all duration-300 ease-out origin-left ${
          isOpen
            ? "opacity-100 scale-100 translate-x-0"
            : "opacity-0 scale-95 -translate-x-2 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-500 hover:text-slate-800"
            onClick={close}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Conteúdo Injetado */}
        {children(close)}
      </div>
    </div>
  )
}
