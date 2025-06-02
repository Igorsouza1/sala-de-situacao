"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import Link from "next/link"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col gap-6 mt-6">
          <Link
            href="#plataforma"
            className="text-lg font-medium text-slate-700 hover:text-[#003C2C]"
            onClick={() => setOpen(false)}
          >
            Plataforma
          </Link>
          <Link
            href="#recursos"
            className="text-lg font-medium text-slate-700 hover:text-[#003C2C]"
            onClick={() => setOpen(false)}
          >
            Recursos
          </Link>
          <Link
            href="#casos"
            className="text-lg font-medium text-slate-700 hover:text-[#003C2C]"
            onClick={() => setOpen(false)}
          >
            Casos de Uso
          </Link>
          <Link
            href="#contato"
            className="text-lg font-medium text-slate-700 hover:text-[#003C2C]"
            onClick={() => setOpen(false)}
          >
            Contato
          </Link>
          <div className="flex flex-col gap-3 pt-6 border-t">
            <Link href="/sign-in" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                Entrar
              </Button>
            </Link>
            <Button className="bg-[#003C2C] hover:bg-[#003C2C]/90">Solicitar Demo</Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
