import * as React from "react"

import { cn } from "@/lib/utils"

// Recolher e expandir sem salto (DESIGN.md 8.4): a altura acompanha em 320 ms e o conteúdo some e volta junto.
// Truque de CSS: a linha do grid vai de 0fr a 1fr, então não precisa medir a altura em JavaScript.
// Fechado, o conteúdo fica `inert`: não recebe foco nem clique, e o leitor de tela o ignora (8.4, regra 2).
//
// `clip`: corta só na vertical e com `overflow: clip`, que NÃO cria um contêiner de rolagem. É o que permite a um filho
// `sticky` (a barra de salvar do editor) continuar grudando no painel e não na caixa que recolhe, e deixa margens negativas
// e anéis de foco passarem dos lados.
function Collapse({ open, clip, className, children }: { open: boolean; clip?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("grid transition-[grid-template-rows] duration-[320ms] ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]", className)}>
      <div
        inert={!open}
        className={cn("min-h-0 transition-opacity duration-[320ms] ease-out", clip ? "overflow-x-visible overflow-y-clip" : "overflow-hidden", open ? "opacity-100" : "opacity-0")}
      >
        {children}
      </div>
    </div>
  )
}

// O mesmo na horizontal: quem sai ENCOLHE em largura enquanto some, e quem entra CRESCE (8.4). Os vizinhos deslizam para o lugar
// em vez de pular. Serve a botões de cabeçalho que aparecem e somem conforme o modo.
function Reveal({ show, className, children }: { show: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("grid transition-[grid-template-columns,opacity] duration-[320ms] ease-out", show ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0", className)}>
      {/* o respiro de 2 px deixa o anel de foco do botão aparecer inteiro dentro do corte */}
      <div inert={!show} className="-mx-0.5 min-w-0 overflow-hidden px-0.5">
        {children}
      </div>
    </div>
  )
}

export { Collapse, Reveal }
