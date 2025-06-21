"use client"

import type React from "react"
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 transform transition-all duration-200 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-pantaneiro-green rounded-t-xl">
          <h2 className="text-lg font-semibold text-white">Detalhes da Camada</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full text-white hover:bg-pantaneiro-lime hover:bg-opacity-20 hover:text-white"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fechar</span>
          </Button>
        </div>
        
        {/* Content */}
        <ScrollArea className="p-6 max-h-[75vh]">
          {children}
        </ScrollArea>
      </div>
    </div>
  )
}
