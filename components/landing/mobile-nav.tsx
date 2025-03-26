"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="text-[#003C2C] hover:bg-[#003C2C]/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        <span className="sr-only">Toggle menu</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-[#f8f5ed] p-6">
          <nav className="flex flex-col gap-6">
            <Link
              href="#recursos"
              className="text-lg font-medium text-[#003C2C] hover:text-[#478D4F]"
              onClick={() => setIsOpen(false)}
            >
              Recursos
            </Link>
            <Link
              href="#depoimentos"
              className="text-lg font-medium text-[#003C2C] hover:text-[#478D4F]"
              onClick={() => setIsOpen(false)}
            >
              Depoimentos
            </Link>
            <Link
              href="#planos"
              className="text-lg font-medium text-[#003C2C] hover:text-[#478D4F]"
              onClick={() => setIsOpen(false)}
            >
              Planos
            </Link>
            <Link
              href="#contato"
              className="text-lg font-medium text-[#003C2C] hover:text-[#478D4F]"
              onClick={() => setIsOpen(false)}
            >
              Contato
            </Link>
            <div className="flex flex-col gap-4 mt-4">
              <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full border-[#003C2C] text-[#003C2C] hover:bg-[#003C2C] hover:text-white"
                >
                  Entrar
                </Button>
              </Link>
              <Button className="w-full bg-[#003C2C] text-white hover:bg-[#478D4F]">Cadastrar</Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}

