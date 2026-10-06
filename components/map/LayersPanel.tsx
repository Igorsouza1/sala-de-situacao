'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Check, Pencil, RefreshCw, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BASEMAP_KEYS, BASEMAP_LABELS, type BasemapKey } from './helpers/basemaps'
import { controlItem } from './helpers/control-style'
import { LayerManager } from './LayerManager'
import { PanelCard } from './PanelCard'

// Painel Camadas (DESIGN.md 13.1): o mapa base primeiro (é a camada de baixo), depois um cartão por categoria de dados.
// O "Atualizar" fica no cabeçalho do painel, porque vale para todas as camadas e não para um cartão só.

// Miniaturas feitas só de tokens: lembram a base sem baixar imagem nenhuma.
const SWATCH: Record<BasemapKey, string> = {
  mineral: 'linear-gradient(135deg, var(--color-map-grass) 0 55%, var(--color-map-water) 55%)',
  'satellite-soft': 'linear-gradient(135deg, color-mix(in oklab, var(--color-muted-foreground) 45%, var(--color-ok)) 0 55%, color-mix(in oklab, var(--color-muted-foreground) 55%, var(--color-water)) 55%)',
  satellite: 'linear-gradient(135deg, color-mix(in oklab, var(--color-foreground) 60%, var(--color-ok)) 0 55%, color-mix(in oklab, var(--color-foreground) 55%, var(--color-water)) 55%)',
  streets: 'linear-gradient(135deg, var(--color-background) 0 55%, var(--color-border) 55%)',
  osm: 'linear-gradient(135deg, var(--color-map-urban) 0 55%, var(--color-map-grass) 55%)',
}

// O rótulo muda no próprio botão (8.4): Atualizar → Atualizando… → Atualizado.
export function RefreshButton({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  const [clicked, setClicked] = useState(false)
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!clicked || refreshing) return
    setClicked(false)
    setDone(true)
    const t = setTimeout(() => setDone(false), 2500)
    return () => clearTimeout(t)
  }, [clicked, refreshing])

  return (
    <button
      type="button"
      aria-disabled={refreshing}
      onClick={() => { if (refreshing) return; setClicked(true); onRefresh() }}
      className={cn('flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium aria-disabled:opacity-45 aria-disabled:hover:bg-transparent', controlItem())}
    >
      {done ? <Check className="h-3.5 w-3.5 text-ok" aria-hidden /> : <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} aria-hidden />}
      <span aria-live="polite">{refreshing ? 'Atualizando…' : done ? 'Atualizado' : 'Atualizar'}</span>
    </button>
  )
}

// Entrada da edição de camadas (13.3): UM botão com rótulo no cabeçalho, só para quem pode editar. A lista não ganha um ícone
// em cada linha (apertava e pedia para decifrar um lápis sem texto). Ligado, a lista vira "escolha a camada".
export function EditModeButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={cn('flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium', active ? 'rounded-sm bg-primary text-primary-foreground transition-[background-color,scale] duration-200 ease-spring hover:bg-primary-hover active:scale-[0.96] focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30' : controlItem())}
    >
      {active ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Pencil className="h-3.5 w-3.5" aria-hidden />}
      <span>{active ? 'Concluir' : 'Editar'}</span>
    </button>
  )
}

// Devolve o controle a quem usa (2.1): o mapa lembra o que a pessoa deixou, e aqui ela desfaz tudo de uma vez.
// O rótulo muda no próprio botão e a frase abaixo diz exatamente o que volta.
function ResetButton({ onReset }: { onReset: () => void }) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 2500)
    return () => clearTimeout(t)
  }, [done])

  return (
    <div>
      <button
        type="button"
        onClick={() => { onReset(); setDone(true) }}
        className={cn('flex h-10 w-full items-center justify-center gap-2 text-sm font-medium', controlItem())}
      >
        {done ? <Check className="h-4 w-4 text-ok" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
        <span aria-live="polite">{done ? 'Voltou ao padrão' : 'Voltar ao padrão do mapa'}</span>
      </button>
      <p className="mt-1 px-2 text-center text-xs leading-snug text-muted-foreground">
        Camadas, mapa base, filtros e posição voltam a como o Prisma abre pela primeira vez.
      </p>
    </div>
  )
}

type LayerManagerProps = React.ComponentProps<typeof LayerManager>

interface LayersPanelProps extends LayerManagerProps {
  /** base escolhida pelo usuário */
  basemap: BasemapKey
  /** base que está de fato na tela (difere da escolhida quando o Mineral não carregou) */
  shownBasemap: BasemapKey
  onBasemapChange: (key: BasemapKey) => void
  onReset: () => void
  /** o editor de uma camada: quando existe, ocupa o painel no lugar da lista (a pessoa vê de onde veio: 8.4) */
  editing?: ReactNode
}

export function LayersPanel({ basemap, shownBasemap, onBasemapChange, onReset, editing, ...layerProps }: LayersPanelProps) {
  const unavailable = basemap !== shownBasemap
  // quais camadas com áreas estão abertas: vive aqui (e não na lista) porque a lista é desmontada enquanto o editor está aberto,
  // e a pessoa precisa voltar para onde estava (8.4)
  const [expanded, setExpanded] = useState<string[]>([])
  const toggleExpanded = (id: string) => setExpanded((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  // o editor entra pela direita e a lista volta pela esquerda: a pessoa vê que foi para dentro e que voltou
  if (editing) return <div key="editor" className="animate-in fade-in-0 slide-in-from-right-4 duration-200">{editing}</div>
  // escolher a camada: só a lista, em botões, com a instrução em cima (a tela diz o que fazer, a pessoa não adivinha)
  if (layerProps.onPick) {
    return (
      <div key="pick" className="animate-in fade-in-0 slide-in-from-right-4 space-y-4 duration-200">
        {/* O modo fica dito, em cor e em frase, mesmo depois de salvar ou cancelar: sem isso a lista parecia a lista normal e a pessoa
            não sabia se ainda estava editando (2.1). A frase também diz o próximo passo. */}
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-secondary p-4 text-secondary-foreground">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden>
            <Pencil className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Você está editando as camadas</p>
            <p className="mt-0.5 text-sm">Escolha a que quer mudar. Quando terminar, toque em Concluir.</p>
          </div>
        </div>
        <LayerManager {...layerProps} expanded={expanded} onToggleExpanded={toggleExpanded} />
      </div>
    )
  }
  return (
    <div key="list" className="panel-rise animate-in fade-in-0 slide-in-from-left-4 space-y-4 duration-200">
      <PanelCard title="Mapa base">
        <div role="radiogroup" aria-label="Mapa base" className="grid grid-cols-3 gap-2.5">
          {BASEMAP_KEYS.map((key) => {
            const selected = key === shownBasemap
            return (
              // clicar no Mineral de novo, depois de falhar, tenta outra vez: por isso não bloqueamos o já escolhido
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onBasemapChange(key)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-md border p-2 text-xs transition-[background-color,border-color,color,translate,scale] duration-200 ease-spring active:scale-[0.96] focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30',
                  selected ? 'border-primary bg-secondary font-medium text-secondary-foreground' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <span className="h-9 w-full rounded-sm border border-border" style={{ background: SWATCH[key] }} aria-hidden />
                {BASEMAP_LABELS[key]}
              </button>
            )
          })}
        </div>
        {unavailable && (
          <p role="status" className="mt-3 text-xs text-muted-foreground">
            {BASEMAP_LABELS[basemap]} indisponível agora. Mostrando {BASEMAP_LABELS[shownBasemap]}.
          </p>
        )}
      </PanelCard>

      <LayerManager {...layerProps} expanded={expanded} onToggleExpanded={toggleExpanded} />

      <ResetButton onReset={onReset} />
    </div>
  )
}
