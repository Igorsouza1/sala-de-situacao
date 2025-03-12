"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <div className="flex flex-col gap-6 py-6">
          <nav className="flex flex-col gap-4">
            <Link
              href="#recursos"
              className="text-lg font-medium hover:text-[hsl(var(--pantaneiro-lime))]"
              onClick={() => setOpen(false)}
            >
              Recursos
            </Link>
            <Link
              href="#depoimentos"
              className="text-lg font-medium hover:text-[hsl(var(--pantaneiro-lime))]"
              onClick={() => setOpen(false)}
            >
              Depoimentos
            </Link>
            <Link
              href="#planos"
              className="text-lg font-medium hover:text-[hsl(var(--pantaneiro-lime))]"
              onClick={() => setOpen(false)}
            >
              Planos
            </Link>
            <Link
              href="#contato"
              className="text-lg font-medium hover:text-[hsl(var(--pantaneiro-lime))]"
              onClick={() => setOpen(false)}
            >
              Contato
            </Link>
          </nav>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Entrar
            </Button>
            <Button
              onClick={() => setOpen(false)}
              className="bg-[hsl(var(--pantaneiro-lime))] text-primary-foreground hover:bg-[hsl(var(--pantaneiro-lime-hover))]"
            >
              Cadastrar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

