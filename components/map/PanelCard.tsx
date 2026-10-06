import type { ReactNode } from 'react'

// Cartão de um assunto dentro de um painel do mapa (DESIGN.md 6.2): o painel tem base em cinza suave e cada assunto mora
// num cartão branco com título. Assim se vê onde um assunto começa e onde termina sem ler, e nada fica "tudo branco".
export function PanelCard({ title, caption, children }: { title: string; caption?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h4 className="text-sm font-semibold">{title}</h4>
      {caption && <p className="mt-1 text-xs leading-snug text-muted-foreground">{caption}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}
