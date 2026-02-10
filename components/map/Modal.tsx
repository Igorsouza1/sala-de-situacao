"use client"

import type React from "react"
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  showEdit?: boolean
  onEdit?: () => void
}

export function Modal({ isOpen, onClose, children, title = "Detalhes da Camada", showEdit = false, onEdit }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex justify-center items-center p-4">
      <div
  className="
    bg-white rounded-lg shadow-2xl
    w-full
    max-w-[75vw]       /* celular: quase tela toda */
    sm:max-w-[60vw]    /* sm: um pouco de margem */
    md:max-w-[80vw]    /* tablet/medio: bem largo */
    lg:max-w-[50vw]    /* desktop: ainda grande */
    xl:max-w-[50vw]    /* monitorzão: não vira TV */
    border border-gray-200
    transform transition-all duration-200
    animate-in fade-in-0 zoom-in-95
  "
>
        {/* Header */}
        <div className="flex justify-between items-center py-3 px-4 bg-brand-dark-blue border-b border-white/10 rounded-t-lg">
          <h2 className="text-base font-semibold text-white tracking-wide">{title}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full text-white/70 hover:bg-white/10 hover:text-white h-7 w-7"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <ScrollArea className="p-6 h-[75vh]">

          {children}
        </ScrollArea>
      </div>
    </div>
  )
}
