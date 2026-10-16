'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Check, Pencil, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BASEMAP_KEYS, BASEMAP_LABELS, BASEMAP_SWATCH, type BasemapKey } from './helpers/basemaps'
import { controlItem } from './helpers/control-style'
import { ViewSwap } from '@/components/ui/view-swap'
import { LayerManager } from './LayerManager'
import { LayerTree, type LayerTreeProps } from './LayerTree'
import type { MapLayout } from './helpers/layer-layout'
import type { SyncStatus } from './helpers/layout-sync'
import { PanelCard } from './PanelCard'

// Painel Camadas (DESIGN.md 13.1): o mapa base primeiro (é a camada de baixo), depois as pastas de camadas da pessoa (uma por categoria, até ela organizar).
// O "Atualizar" fica no cabeçalho do painel, porque vale para todas as camadas e não para um cartão só.


// Entrada da edição de camadas (13.3): UM botão com rótulo no cabeçalho, só para quem pode editar. A lista não ganha um ícone
// em cada linha (apertava e pedia para decifrar um lápis sem texto). Ligado, a lista vira "escolha a camada".
export function EditModeButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  // Os dois rótulos (e os dois ícones) ocupam o mesmo lugar e trocam em crossfade; a cor do botão passa do neutro ao verde cheio.
  // A largura é a do maior rótulo, então o botão não pula de tamanho quando o texto muda (8.4).
  const swap = (on: boolean) => cn('col-start-1 row-start-1 transition-[opacity,translate] duration-300 ease-out', on ? 'opacity-100' : 'translate-y-1 opacity-0')
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-xs font-medium transition-[background-color,color,scale,translate] duration-300 ease-spring active:scale-[0.96] focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30',
        active ? 'bg-primary text-primary-foreground hover:bg-primary-hover' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <span className="grid" aria-hidden>
        <Pencil className={cn(swap(!active), 'h-3.5 w-3.5')} />
        <Check className={cn(swap(active), 'h-3.5 w-3.5')} />
      </span>
      <span className="grid">
        <span className={swap(!active)} aria-hidden={active}>Editar</span>
        <span className={swap(active)} aria-hidden={!active}>Concluir</span>
      </span>
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
        Camadas, pastas, ordem, mapa base, filtros e posição voltam a como o Prisma abre pela primeira vez.
      </p>
    </div>
  )
}

// Diz o que está acontecendo com a organização (2.1): salvando, salvo, tentando de novo, erro, ou só neste aparelho.
// Fica quieta quando nada mudou. "Salvo" aparece uns segundos e se apaga; o erro fica até a pessoa agir, e o que ela fez continua na tela.
function LayoutStatusLine({ status, onRetry }: { status: SyncStatus; onRetry: () => void }) {
  const [savedShown, setSavedShown] = useState(false)
  const [left, setLeft] = useState(0)
  useEffect(() => {
    if (status.kind !== 'saved') { setSavedShown(false); return }
    setSavedShown(true)
    const t = setTimeout(() => setSavedShown(false), 2500)
    return () => clearTimeout(t)
  }, [status])
  useEffect(() => {
    if (status.kind !== 'retrying') return
    const tick = () => setLeft(Math.max(0, Math.ceil((status.at - Date.now()) / 1000)))
    tick()
    const t = setInterval(tick, 500)
    return () => clearInterval(t)
  }, [status])

  const action = (label: string) => (
    <button type="button" onClick={onRetry} className="underline underline-offset-2 hover:text-foreground">
      {label}
    </button>
  )
  let content: ReactNode = null
  let tone = 'text-muted-foreground'
  if (status.kind === 'saving') content = 'Salvando…'
  else if (status.kind === 'saved' && savedShown) content = <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-ok" aria-hidden />Salvo na sua conta</span>
  else if (status.kind === 'retrying') content = <>Não salvou. Tentando de novo em {left} s. {action('Tentar agora')}</>
  else if (status.kind === 'error') { tone = 'text-crit'; content = <>Não salvou. O que você fez continua aqui. {action('Tentar de novo')}</> }
  else if (status.kind === 'local') content = 'A organização fica só neste aparelho.'

  // a linha ocupa sempre o mesmo lugar: quando não há o que dizer, o cartão não pula (8.4)
  return (
    <p role="status" aria-live="polite" className={cn('min-h-4 px-2 text-center text-xs leading-snug transition-opacity duration-300', tone, content ? 'opacity-100' : 'opacity-0')}>
      {content}
    </p>
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
  /** a organização da pessoa (13.1): pastas e ordem. Sem ela (o catálogo ainda chega) a lista agrupa por categoria. */
  tree?: {
    layout: MapLayout
    onChange: (change: (layout: MapLayout) => MapLayout) => void
    onFolderToggle: (folderId: string) => void
    actions: LayerTreeProps['actions']
    status: SyncStatus
    onRetrySave: () => void
  }
}

export function LayersPanel({ basemap, shownBasemap, onBasemapChange, onReset, editing, tree, ...layerProps }: LayersPanelProps) {
  const unavailable = basemap !== shownBasemap
  // quais camadas com áreas estão abertas: vive aqui (e não na lista) porque a lista é desmontada enquanto o editor está aberto,
  // e a pessoa precisa voltar para onde estava (8.4)
  const [expanded, setExpanded] = useState<string[]>([])
  const toggleExpanded = (id: string) => setExpanded((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  // Escolher o que editar: só a lista, em botões, com o aviso do modo em cima. O modo fica dito, em cor e em frase, mesmo depois de salvar
  // ou cancelar: sem isso a lista parecia a lista normal e a pessoa não sabia se ainda estava editando (2.1). A frase diz o próximo passo.
  const pickView = layerProps.onPick ? (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-secondary p-4 text-secondary-foreground">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden>
          <Pencil className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Você está editando as camadas</p>
          <p className="mt-0.5 text-sm">Escolha a que quer mudar. Quando terminar, toque em Concluir.</p>
        </div>
      </div>
      <LayerManager {...layerProps} layout={tree?.layout} expanded={expanded} onToggleExpanded={toggleExpanded} />
    </div>
  ) : null

  const listView = (
    <div className="panel-rise space-y-4">
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
                <span className="h-9 w-full rounded-sm border border-border" style={{ background: BASEMAP_SWATCH[key] }} aria-hidden />
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

      {tree && layerProps.options.length > 0 ? (
        <LayerTree
          options={layerProps.options}
          layout={tree.layout}
          activeLayers={layerProps.activeLayers}
          onLayerToggle={layerProps.onLayerToggle}
          onGroupToggle={layerProps.onGroupToggle}
          onFolderToggle={tree.onFolderToggle}
          actions={tree.actions}
          onHideAll={layerProps.onHideAll}
          onLayoutChange={tree.onChange}
          status={layerProps.status}
          onRetry={layerProps.onRetry}
          counts={layerProps.counts}
          filterNotes={layerProps.filterNotes}
          flashSlug={layerProps.flashSlug}
          expanded={expanded}
          onToggleExpanded={toggleExpanded}
        />
      ) : (
        <LayerManager {...layerProps} expanded={expanded} onToggleExpanded={toggleExpanded} />
      )}

      {tree && <LayoutStatusLine status={tree.status} onRetry={tree.onRetrySave} />}

      <ResetButton onReset={onReset} />
    </div>
  )

  // As três visões ficam no mesmo painel e trocam com a altura acompanhando (8.4): a lista, a escolha do que editar e o editor.
  const view = editing ? 'editor' : layerProps.onPick ? 'pick' : 'list'
  return <ViewSwap view={view} views={{ list: listView, pick: pickView, editor: editing ?? null }} />
}
