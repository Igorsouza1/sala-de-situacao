"use client"

import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { MiniSpark } from "./mini-spark"
import { TOM_COR, TOM_PALAVRA, type Tom } from "./estado"

// Um assunto no resumo (DESIGN.md 19.1): cartão branco com título, a frase do estado, a data do dado e uma linha pequena.
// O cartão inteiro abre o detalhe. O estado vem em cor e em palavra; a cor sozinha não diz (4.2).
export interface CartaoProps {
  titulo: string
  icone: LucideIcon
  estado: "carregando" | "pronto" | "erro"
  tom?: Tom
  frase?: string
  apoio?: string | null
  serie?: number[]
  /** o assunto não recebe leituras novas: a tela diz, para ninguém esperar dado que não vem */
  aviso?: string
  onAbrir: () => void
  onTentar: () => void
}

export function Cartao({ titulo, icone: Icone, estado, tom = "neutro", frase, apoio, serie, aviso, onAbrir, onTentar }: CartaoProps) {
  if (estado === "erro") {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <Cabecalho titulo={titulo} icone={Icone} />
        <p className="mt-2 text-sm">Não foi possível carregar.</p>
        <p className="mt-0.5 text-xs text-muted-foreground">O resto do painel continua funcionando.</p>
        <button
          type="button"
          onClick={onTentar}
          className="mt-3 min-h-10 rounded-sm px-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-secondary focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
        >
          Tentar de novo
        </button>
      </div>
    )
  }

  if (estado === "carregando") {
    return (
      <div className="rounded-lg border border-border bg-card p-4" aria-busy>
        <Cabecalho titulo={titulo} icone={Icone} />
        <Skeleton className="mt-3 h-5 w-3/4" />
        <Skeleton className="mt-2 h-3 w-1/2" />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onAbrir}
      className={cn(
        "group block w-full rounded-lg border border-border bg-card p-4 text-left shadow-control",
        "transition-[translate,box-shadow,border-color] duration-200 ease-spring hover:-translate-y-px hover:border-mineral active:scale-[0.99]",
        "focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30",
      )}
    >
      <Cabecalho titulo={titulo} icone={Icone} tom={tom} />
      <div className="mt-2 flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-snug">{frase}</p>
          {apoio && <p className="mt-0.5 text-xs text-muted-foreground">{apoio}</p>}
          {aviso && <p className="mt-0.5 text-xs text-muted-foreground">{aviso}</p>}
        </div>
        {serie && serie.length > 1 && (
          <div className="w-24 flex-none">
            <MiniSpark data={serie} color={TOM_COR[tom]} />
          </div>
        )}
        <ChevronRight className="mb-0.5 h-4 w-4 flex-none text-muted-foreground transition-transform duration-200 ease-spring group-hover:translate-x-0.5" aria-hidden />
      </div>
    </button>
  )
}

function Cabecalho({ titulo, icone: Icone, tom }: { titulo: string; icone: LucideIcon; tom?: Tom }) {
  return (
    <div className="flex items-center gap-2">
      <Icone className="h-4 w-4 flex-none text-muted-foreground" aria-hidden />
      <h4 className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">{titulo}</h4>
      {tom && (
        <span className="flex flex-none items-center gap-1.5 text-xs text-muted-foreground">
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: TOM_COR[tom] }} />
          {TOM_PALAVRA[tom]}
        </span>
      )}
    </div>
  )
}
