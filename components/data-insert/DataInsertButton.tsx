"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DataInsertButtonProps {
  onClick: () => void
}

export function DataInsertButton({ onClick }: DataInsertButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="sm"
      className="w-full bg-pantaneiro-lime hover:bg-pantaneiro-lime/90 text-pantaneiro-green font-medium"
    >
      <Plus className="h-4 w-4 mr-2" />
      Adicionar Dados
    </Button>
  )
}
