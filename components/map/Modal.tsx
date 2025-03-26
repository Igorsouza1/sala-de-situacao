"use client"

import type React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  id?: string // ID é opcional
}

export function Modal({ isOpen, onClose, title, children, id }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex justify-center items-center">
      <div className="bg-background dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl border border-[hsl(var(--border))]">
        <div className="flex justify-between items-center p-4 bg-[hsl(var(--secondary))] dark:bg-gray-700 rounded-t-lg border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] dark:text-white">{title}</h2>
            {id && (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--pantaneiro-lime)/0.2)] text-xs font-medium text-[hsl(var(--pantaneiro-lime))]">
                {id}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-[hsl(var(--pantaneiro-green)/0.15)] hover:text-[hsl(var(--pantaneiro-green))]"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fechar</span>
          </Button>
        </div>
        <ScrollArea className="p-6 max-h-[70vh]">{children}</ScrollArea>
      </div>
    </div>
  )
}

