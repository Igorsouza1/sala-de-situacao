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
    bg-white rounded-xl shadow-2xl
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
        <div className="flex justify-between items-center p-4 bg-pantaneiro-green rounded-t-xl">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <div className="flex items-center gap-2">
            {showEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="rounded-full text-white hover:bg-pantaneiro-lime hover:bg-opacity-20 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M15.232 5.232l3.536 3.536M9 11.768l3.536 3.536m-6.364 1.414l3.536-3.536m6.364-6.364L10.172 15.1a2 2 0 01-.879.53l-3.535 1.01a.5.5 0 01-.616-.616l1.01-3.535a2 2 0 01.53-.879l8.596-8.596a2 2 0 112.828 2.828z" />
                </svg>
                <span className="sr-only">Editar</span>
              </Button>
            )}
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
        </div>
        
        {/* Content */}
        <ScrollArea className="p-6 h-[75vh]">

          {children}
        </ScrollArea>
      </div>
    </div>
  )
}
