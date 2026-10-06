import * as React from "react"

import { cn } from "@/lib/utils"

// Recolher e expandir sem salto (DESIGN.md 8.4): a altura acompanha em 320 ms e o conteúdo some e volta junto.
// Truque de CSS: a linha do grid vai de 0fr a 1fr, então não precisa medir a altura em JavaScript.
// Fechado, o conteúdo fica `inert`: não recebe foco nem clique, e o leitor de tela o ignora (8.4, regra 2).
function Collapse({ open, className, children }: { open: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("grid transition-[grid-template-rows] duration-[320ms] ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]", className)}>
      <div inert={!open} className={cn("min-h-0 overflow-hidden transition-opacity duration-[320ms] ease-out", open ? "opacity-100" : "opacity-0")}>
        {children}
      </div>
    </div>
  )
}

export { Collapse }
