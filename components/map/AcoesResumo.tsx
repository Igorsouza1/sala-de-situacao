'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChartColumn, ChevronDown, X } from 'lucide-react'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import { cn } from '@/lib/utils'
import { controlItem, controlSurface } from './helpers/control-style'
import { countRuleLegend, type CountedEntry } from './helpers/legend-rules'
import { countByYear } from './helpers/acoes-summary'
import { ColorSwatch, IconSwatch } from './MapLegend'
import { PanelCard } from './PanelCard'

// O resumo das Ações (DESIGN.md 13.13): quantas há, de que cor (situação), de que área e de que ano, de TODAS as ações da região,
// mesmo as que os filtros escondem do mapa (a visão geral não pode mudar com o período escolhido). Mora no canto de cima à esquerda, ao lado do sino, como um botão que se recolhe: só aparece com a camada
// Ações ligada e só ocupa o mapa quando a pessoa abre. A cor e o ícone vêm da mesma classificação da legenda e do pino (C20, C29):
// o que o gráfico diz vermelho é o que o mapa desenha vermelho. Os cartões são informativos (7.2): não se movem nem se clicam.

type Item = { properties?: Record<string, unknown> | null; count?: number }

interface Group {
  status: string | null
  carater: string | null
  eixo_tematico: string | null
  ano: number | null
  count: number
}

interface AcoesResumoProps {
  /** a camada Ações está ligada: o botão aparece */
  show: boolean
  regiaoId?: number
  /** muda quando as ações mudam (uma edição recarrega a camada): o resumo busca de novo */
  refreshKey: unknown
  /** quantas o mapa mostra agora (com os filtros); null enquanto carregam */
  onMap: number | null
  /** o visual da camada (as regras de cor e ícone do catálogo) */
  config: { baseStyle?: { color?: string; iconName?: string }; rules?: unknown[] } | null | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

const n = (v: number) => v.toLocaleString('pt-BR')
const share = (v: number, total: number) => {
  if (!total || !v) return '0%'
  const p = (v / total) * 100
  return p < 1 ? 'menos de 1%' : `${Math.round(p)}%`
}

function Skeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <div className="h-3 w-full rounded-sm bg-shimmer" />
      <div className="h-4 w-3/4 rounded-sm bg-shimmer" />
      <div className="h-4 w-1/2 rounded-sm bg-shimmer" />
    </div>
  )
}

/** Cor dos pinos: a barra inteira é o total, cada pedaço uma cor (parte do todo); embaixo, a lista com quantas e quanto do total. */
function ColorCard({ entries, total }: { entries: CountedEntry[]; total: number }) {
  return (
    <PanelCard title="Cor dos pinos" caption="A cor diz a situação de cada ação.">
      <div className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-[4px]" aria-hidden>
        {entries.filter((e) => e.count > 0).map((e) => (
          <span key={e.key} className="h-full" style={{ flexGrow: e.count, backgroundColor: e.color }} />
        ))}
      </div>
      <ul className="mt-3 space-y-1">
        {entries.map((e) => (
          <li key={e.key} className="flex min-h-8 items-center gap-2.5">
            <ColorSwatch color={e.color ?? 'transparent'} />
            <span className="min-w-0 flex-1 truncate text-sm">{e.label}</span>
            <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{share(e.count, total)}</span>
            <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums">{n(e.count)}</span>
          </li>
        ))}
      </ul>
    </PanelCard>
  )
}

/** Ícone dos pinos (a área): uma linha por área, da maior para a menor, com a barra do tamanho dela. A barra é neutra: a cor já é da situação. */
function IconCard({ entries }: { entries: CountedEntry[] }) {
  const max = Math.max(1, ...entries.map((e) => e.count))
  return (
    <PanelCard title="Ícone dos pinos" caption="O ícone diz a área de cada ação.">
      <ul className="mt-3 space-y-2">
        {entries.map((e) => (
          <li key={e.key} className="flex items-center gap-2.5">
            <IconSwatch name={e.iconName ?? 'map-pin'} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-sm">{e.label}</span>
                <span className="shrink-0 font-mono text-sm tabular-nums">{n(e.count)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-mineral" style={{ width: `${(e.count / max) * 100}%` }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </PanelCard>
  )
}

/** Por ano: uma coluna por ano, com o número em cima. O ano de mais ações em cor cheia; o ano sem ação aparece como zero. */
function YearCard({ items }: { items: Item[] }) {
  const { years, undated } = useMemo(() => countByYear(items, 'ano'), [items])
  if (!years.length) {
    return (
      <PanelCard title="Por ano">
        <p className="text-sm text-muted-foreground">As ações da região não têm data.</p>
      </PanelCard>
    )
  }
  const max = Math.max(...years.map((y) => y.count))
  const peak = years.find((y) => y.count === max)!
  const crowded = years.length > 6
  const label = (y: number, i: number) => (crowded && i > 0 && i < years.length - 1 ? `’${String(y).slice(2)}` : `${y}`)
  return (
    <PanelCard
      title="Por ano"
      caption={`O ano com mais ações foi ${peak.year}, com ${n(peak.count)}.${undated ? ` ${n(undated)} ${undated === 1 ? 'ação não tem' : 'ações não têm'} data.` : ''}`}
    >
      <div
        role="img"
        aria-label={`Ações por ano: ${years.map((y) => `${y.year}, ${y.count}`).join('; ')}.`}
        className="mt-3 flex h-28 items-end gap-1"
      >
        {years.map((y, i) => (
          <div key={y.year} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" aria-hidden>
            <span className="mb-1 font-mono text-xs tabular-nums text-muted-foreground">{n(y.count)}</span>
            <div
              className={cn('w-full max-w-8 rounded-t-[4px]', y === peak ? 'bg-mineral' : 'bg-mineral/50')}
              style={{ height: `${(y.count / max) * 64}px`, minHeight: y.count ? 2 : 0 }}
            />
            <span className="mt-1 border-t border-border pt-1 font-mono text-xs tabular-nums text-muted-foreground">{label(y.year, i)}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  )
}

/** Todas as ações da região, contadas por grupo no servidor. Busca quando a camada liga, e de novo quando as ações mudam. */
function useAcoesResumo(enabled: boolean, regiaoId: number | undefined, refreshKey: unknown) {
  const [state, setState] = useState<{ phase: 'carregando' } | { phase: 'erro' } | { phase: 'pronto'; items: Item[] }>({ phase: 'carregando' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const abort = new AbortController()
    // ao recarregar, o que já está na tela fica até chegar o novo
    setState((s) => (s.phase === 'pronto' ? s : { phase: 'carregando' }))
    const params = new URLSearchParams()
    if (regiaoId) params.set('regiao_id', String(regiaoId))
    fetch(`/api/map/acoes-resumo?${params}`, { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('resumo'))))
      .then((data: { groups: Group[] }) => {
        const items = data.groups.map(({ count, ...properties }) => ({ properties, count }))
        setState({ phase: 'pronto', items })
      })
      .catch(() => { if (!abort.signal.aborted) setState({ phase: 'erro' }) })
    return () => abort.abort()
  }, [enabled, regiaoId, refreshKey, attempt])
  const retry = useCallback(() => { setState({ phase: 'carregando' }); setAttempt((k) => k + 1) }, [])
  return { state, retry }
}

export function AcoesResumo({ show, regiaoId, refreshKey, onMap, config, open, onOpenChange }: AcoesResumoProps) {
  const { state, retry } = useAcoesResumo(show, regiaoId, refreshKey)
  const items = state.phase === 'pronto' ? state.items : null
  const sections = useMemo(() => (items ? countRuleLegend(config as never, items) : []), [items, config])
  const cor = sections.find((s) => s.title === 'Cor')
  const icone = sections.find((s) => s.title === 'Ícone')
  const total = items ? items.reduce((a, i) => a + (i.count ?? 1), 0) : 0
  const loading = state.phase === 'carregando'
  const visible = show && open

  // Esc fecha (sem fechar junto um seletor aberto por dentro: C19)
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) onOpenChange(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, onOpenChange])

  const label = !items ? 'Ações' : `${n(total)} ${total === 1 ? 'ação' : 'ações'}`

  return (
    // ao lado do sino (left-4 + 40 px + 8 px); entra crescendo e sai encolhendo com a camada (8.1)
    <div
      className={cn(
        'absolute left-16 top-4 z-[400] origin-top-left transition-[opacity,scale,visibility]',
        show ? 'visible scale-100 opacity-100 duration-[240ms] ease-spring' : 'invisible scale-95 opacity-0 duration-150 ease-in',
      )}
      inert={!show}
    >
      <button
        type="button"
        aria-expanded={visible}
        aria-label={open ? `Recolher o resumo das ${label}` : `Ver o resumo das ${label}`}
        onClick={() => onOpenChange(!open)}
        className={cn('flex h-10 items-center gap-2 rounded-md px-3 hover:-translate-y-px', controlSurface, controlItem(visible))}
      >
        <ChartColumn className="h-[18px] w-[18px]" aria-hidden />
        <span className="whitespace-nowrap text-sm font-medium tabular-nums">{label}</span>
        <ChevronDown className={cn('h-4 w-4 transition-[rotate] duration-300 ease-spring', visible && 'rotate-180')} aria-hidden />
      </button>

      <div
        role="dialog"
        aria-modal="false"
        aria-label="Resumo das ações"
        inert={!visible}
        className={cn(
          'absolute left-0 top-full mt-3 flex max-h-[calc(100svh-9rem)] w-[22rem] max-w-[calc(100vw-5rem)] origin-top-left flex-col overflow-hidden rounded-lg',
          'transition-[opacity,translate,scale,visibility]',
          controlSurface,
          visible ? 'visible scale-100 opacity-100 duration-[240ms] ease-spring' : 'invisible -translate-y-2 scale-95 opacity-0 duration-150 ease-in',
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border py-2.5 pl-5 pr-3">
          <h3 className="whitespace-nowrap text-base font-semibold">Ações no mapa</h3>
          <button type="button" aria-label="Recolher o resumo das ações" onClick={() => onOpenChange(false)} className={cn('flex h-8 w-8 items-center justify-center', controlItem())}>
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>
        <OverlayScroll className="bg-muted/50 p-4">
          <div className="space-y-4" aria-live="polite" aria-busy={loading}>
            {loading ? (
              <PanelCard title="Contando as ações…">
                <Skeleton />
              </PanelCard>
            ) : state.phase === 'erro' ? (
              <PanelCard title="Não foi possível carregar o resumo">
                <p role="alert" className="text-sm leading-snug text-muted-foreground">O mapa e as ações continuam como estão. Confira a conexão e tente de novo.</p>
                <button type="button" onClick={retry} className={cn('mt-3 h-9 rounded-md border border-border px-3 text-sm font-medium', controlItem())}>
                  Tentar de novo
                </button>
              </PanelCard>
            ) : total === 0 ? (
              <PanelCard title="Nenhuma ação na região">
                <p className="text-sm leading-snug text-muted-foreground">Quando a primeira ação for registrada, o resumo aparece aqui.</p>
              </PanelCard>
            ) : (
              <>
                <p className="text-xs leading-snug text-muted-foreground">
                  {total === 1 ? 'A única ação da região' : `Todas as ${n(total)} ações da região`}, mesmo as que os filtros escondem do mapa.
                  {onMap !== null && onMap !== total && ` O mapa mostra ${n(onMap)} agora.`}
                </p>
                {cor && <ColorCard entries={cor.entries} total={total} />}
                {icone && <IconCard entries={icone.entries} />}
                <YearCard items={items!} />
              </>
            )}
          </div>
        </OverlayScroll>
      </div>
    </div>
  )
}
