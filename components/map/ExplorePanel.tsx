'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, ChevronRight, ClipboardList, House, MapPin, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { ViewSwap } from '@/components/ui/view-swap'
import { cn } from '@/lib/utils'
import type { ConsultaBounds, ConsultaItem, ConsultaKind, ConsultaSelection } from '@/types/map-consulta'
import type { LayerVisualConfig } from '@/types/map-dto'
import { PanelCard } from './PanelCard'
import { areaText, dateText, listParams, placeText, propertyNames } from './helpers/explore'
import { ICON_STROKE, resolveLayerIcon } from './helpers/layer-icons'
import { resolveFeatureStyle } from './helpers/map-visuals'
import { tidyText } from './helpers/text'
import { useConsultaDetail } from './useConsultaDetail'
import { useConsultaList } from './useConsultaList'

// Painel Explorar (DESIGN.md 13.5): "o que existe aqui?". Duas visões no mesmo painel: a lista (Ações e Propriedades, com busca) e o
// registro aberto, com o desenho no mapa. Segue a receita 19.1 (linhas) e 19.2 (painel): base cinza, um cartão por assunto, linha
// de 48 px ou mais, e a troca de visão por ViewSwap. O marcador de cada ação é o do mapa (mesma cor e mesmo ícone, 6.2 regra 5).

/** a cor e o ícone que o mapa desenha para esta ação (as regras do catálogo): o ponto de status usa a mesma cor do marcador (C29) */
function actionStyle(item: ConsultaItem, visualConfig?: LayerVisualConfig) {
  return resolveFeatureStyle({ baseStyle: visualConfig?.baseStyle || visualConfig, rules: visualConfig?.rules }, { properties: item }) as { color?: string; iconName?: string }
}

/** o marcador do mapa: círculo com o ícone da área, na cor da regra do catálogo */
function Mark({ item, kind, visualConfig, size = 36 }: { item: ConsultaItem; kind: ConsultaKind; visualConfig?: LayerVisualConfig; size?: number }) {
  if (kind === 'propriedades') {
    return (
      <span aria-hidden style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <House size={Math.round(size / 2)} />
      </span>
    )
  }
  const style = actionStyle(item, visualConfig)
  const Icon = resolveLayerIcon(style.iconName)
  return (
    <span aria-hidden style={{ width: size, height: size, backgroundColor: style.color || 'var(--color-primary)' }} className="flex shrink-0 items-center justify-center rounded-full ring-2 ring-white">
      <Icon size={Math.round(size / 2)} color="white" stroke={ICON_STROKE} />
    </span>
  )
}

function Row({ item, kind, visualConfig, onSelect }: { item: ConsultaItem; kind: ConsultaKind; visualConfig?: LayerVisualConfig; onSelect: (s: ConsultaSelection) => void }) {
  const action = kind === 'acoes'
  const name = tidyText(item.nome)
  const size = item.area != null ? `${item.area.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} hectares` : null
  const second = action ? areaText(item) || 'Ação' : [placeText(item) || 'Município não informado', size].filter(Boolean).join(' · ')
  const date = dateText(item)
  const third = action ? (date ? `Registrada em ${date}` : null) : item.titular ? `Titular: ${tidyText(item.titular)}` : null
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect({ kind, id: item.id })}
        className="group flex min-h-16 w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-muted focus-visible:bg-muted focus-visible:outline-hidden"
      >
        <Mark item={item} kind={kind} visualConfig={visualConfig} size={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-snug">{name}</span>
          <span className="mt-1 block truncate text-xs leading-snug text-muted-foreground">{second}</span>
          {third && <span className="block truncate text-xs leading-snug text-muted-foreground">{third}</span>}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-[translate] duration-200 ease-spring group-hover:translate-x-0.5" aria-hidden />
      </button>
    </li>
  )
}

function RowSkeleton() {
  return (
    <div aria-hidden className="flex min-h-16 items-center gap-3.5 px-4 py-3.5">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

interface EmptyHint { title: string; phrase: string; action?: { label: string; run: () => void } }

/** a lista com todos os estados: carregando (esqueleto), erro, vazio (com o próximo passo) e "mostrar mais" */
function Results({ list, kind, visualConfig, onSelect, empty }: { list: ReturnType<typeof useConsultaList>; kind: ConsultaKind; visualConfig?: LayerVisualConfig; onSelect: (s: ConsultaSelection) => void; empty: EmptyHint }) {
  const loadingFirst = list.loading && list.items.length === 0
  return (
    <div aria-busy={list.loading}>
      {loadingFirst && <div role="status"><span className="sr-only">Buscando…</span><RowSkeleton /><RowSkeleton /><RowSkeleton /></div>}
      {list.items.length > 0 && <ul className="divide-y divide-border">{list.items.map((item) => <Row key={item.id} item={item} kind={kind} visualConfig={visualConfig} onSelect={onSelect} />)}</ul>}
      {list.error && (
        <div role="alert" className="p-4">
          <p className="text-sm font-semibold">Não foi possível carregar a lista</p>
          <p className="mt-0.5 text-xs text-muted-foreground">O que você digitou continua aqui.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={list.retry}>Tentar de novo</Button>
        </div>
      )}
      {!list.loading && !list.error && list.items.length === 0 && (
        <div className="p-4 text-center">
          <p className="text-sm font-semibold">{empty.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{empty.phrase}</p>
          {empty.action && <Button variant="outline" size="sm" className="mt-3" onClick={empty.action.run}>{empty.action.label}</Button>}
        </div>
      )}
      {list.hasMore && !list.error && (
        <div className="border-t border-border p-4">
          <Button variant="outline" size="sm" className="w-full" aria-disabled={list.loading} onClick={() => { if (!list.loading) list.loadMore() }}>
            {list.loading ? 'Carregando…' : 'Mostrar mais'}
          </Button>
        </div>
      )}
    </div>
  )
}

/** cartão da lista: o título diz o que se vê e a linha de apoio diz a ordem; as linhas ocupam o cartão de borda a borda (19.1) */
function ListCard({ title, caption, children }: { title: string; caption: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="p-4 pb-3">
        <h4 className="break-words text-sm font-semibold">{title}</h4>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{caption}</p>
      </div>
      <div className="border-t border-border">{children}</div>
    </section>
  )
}

interface ExplorePanelProps {
  regiaoId?: number
  regionName?: string
  actionVisualConfig?: LayerVisualConfig
  selection: ConsultaSelection | null
  onSelect: (selection: ConsultaSelection | null) => void
  onFocus: (item: ConsultaItem) => void
  getBounds: () => ConsultaBounds | null
  onDossie: (selection: ConsultaSelection) => void
}

export function ExplorePanel({ regiaoId, regionName, actionVisualConfig, selection, onSelect, onFocus, getBounds, onDossie }: ExplorePanelProps) {
  const [kind, setKind] = useState<ConsultaKind>('acoes')
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [bounds, setBounds] = useState<ConsultaBounds | null>(null)

  // a busca aplica sozinha, um instante depois da última tecla (2.2: cada etapa é um custo); Enter aplica já
  useEffect(() => {
    const t = setTimeout(() => setQuery(draft.trim()), 350)
    return () => clearTimeout(t)
  }, [draft])

  const list = useConsultaList(listParams({ kind, query, bounds, regiaoId }))

  // Voltar diz para onde leva (19.5): para a lista, ou para o registro de onde a pessoa veio. A trilha só vale para o que a pessoa
  // abriu aqui dentro; se o registro mudou por fora (um clique no mapa), a trilha recomeça.
  const trail = useRef<{ selection: ConsultaSelection; label: string }[]>([])
  const expected = useRef<string | null | undefined>(undefined)
  const keyOf = (s: ConsultaSelection | null) => (s ? `${s.kind}:${s.id}` : null)
  const { item, error, retry } = useConsultaDetail(selection, regiaoId, onFocus)
  const selectionKey = keyOf(selection)
  useEffect(() => {
    if (expected.current !== selectionKey) trail.current = []
    expected.current = undefined
  }, [selectionKey])

  const go = (next: ConsultaSelection | null) => { expected.current = keyOf(next); onSelect(next) }
  const openFromList = (next: ConsultaSelection) => { trail.current = []; go(next) }
  const openRelated = (next: ConsultaSelection) => {
    if (selection) trail.current.push({ selection, label: item ? tidyText(item.nome) : kind === 'acoes' ? 'a ação' : 'a propriedade' })
    go(next)
  }
  const back = () => go(trail.current.pop()?.selection ?? null)
  const backLabel = trail.current.length ? `Voltar a ${trail.current[trail.current.length - 1].label}` : kind === 'acoes' ? 'Voltar às ações' : 'Voltar às propriedades'

  const clearSearch = () => { setDraft(''); setQuery('') }
  const hasFilter = !!query || !!bounds
  const emptyHint: EmptyHint = query
    ? { title: `Não encontramos “${query}”`, phrase: 'Tente outra palavra ou limpe a busca.', action: { label: 'Limpar busca', run: clearSearch } }
    : bounds
      ? { title: 'Nada nesta área do mapa', phrase: 'Mova o mapa e ligue de novo, ou veja a região inteira.', action: { label: 'Ver a região inteira', run: () => setBounds(null) } }
      : { title: kind === 'acoes' ? 'Ainda não há ações nesta região' : 'Ainda não há propriedades nesta região', phrase: 'Quando houver, elas aparecem aqui.' }

  const listView = (
    <div className="space-y-4">
      <PanelCard title="Buscar" caption={regionName ? `Ações e propriedades de ${tidyText(regionName)}.` : 'Ações e propriedades da região.'}>
        <div className="space-y-3">
          <div role="group" aria-label="O que explorar" className="grid grid-cols-2 gap-1 rounded-md border border-border bg-card p-1">
            {(['acoes', 'propriedades'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={kind === tab}
                onClick={() => { setKind(tab); clearSearch() }}
                className={cn(
                  'flex h-9 items-center justify-center gap-2 rounded-sm text-sm font-medium transition-[background-color,color,scale] duration-200 ease-spring active:scale-[0.96] focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30',
                  kind === tab ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {tab === 'acoes' ? <ClipboardList className="h-4 w-4" aria-hidden /> : <House className="h-4 w-4" aria-hidden />}
                {tab === 'acoes' ? 'Ações' : 'Propriedades'}
              </button>
            ))}
          </div>

          <form role="search" onSubmit={(e) => { e.preventDefault(); setQuery(draft.trim()) }} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={150}
              aria-label={kind === 'acoes' ? 'Buscar ações por nome, tipo ou propriedade' : 'Buscar propriedades por nome, CAR ou titular'}
              placeholder={kind === 'acoes' ? 'Nome, tipo ou propriedade' : 'Nome, CAR ou titular'}
              className="pl-9 pr-10"
            />
            {draft && (
              <button type="button" aria-label="Limpar busca" onClick={clearSearch} className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </form>

          <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm">Só nesta área do mapa</span>
              <span className="block text-xs leading-snug text-muted-foreground">{bounds ? 'A área que estava na tela ao ligar. Para trocar, desligue e ligue de novo.' : 'Mostra a região inteira.'}</span>
            </span>
            <Switch checked={!!bounds} onCheckedChange={(on) => setBounds(on ? getBounds() : null)} aria-label="Só nesta área do mapa" />
          </label>
        </div>
      </PanelCard>

      <ListCard
        title={query ? `Resultados para “${query}”` : kind === 'acoes' ? 'Ações da região' : 'Propriedades da região'}
        caption={kind === 'acoes' ? 'As últimas registradas vêm primeiro.' : 'Em ordem alfabética.'}
      >
        <Results list={list} kind={kind} visualConfig={actionVisualConfig} onSelect={openFromList} empty={emptyHint} />
      </ListCard>
      {hasFilter && <p className="sr-only" role="status">{list.loading ? 'Buscando…' : `${list.items.length}${list.hasMore ? ' ou mais' : ''} resultados.`}</p>}
    </div>
  )

  const detailView = selection ? (
    <div className="space-y-4">
      <button type="button" onClick={back} className="-ml-1 flex h-10 max-w-full items-center gap-2 rounded-sm px-2 text-sm font-medium text-muted-foreground transition-[background-color,color,translate] duration-200 ease-spring hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30">
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{backLabel}</span>
      </button>
      {error ? (
        <section role="alert" className="rounded-lg border border-crit/40 bg-card p-4">
          <p className="text-sm font-semibold">Não foi possível abrir o registro</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={retry}>Tentar de novo</Button>
        </section>
      ) : !item ? (
        <div role="status" className="space-y-4">
          <span className="sr-only">Abrindo o registro…</span>
          <section aria-hidden className="rounded-lg border border-border bg-card p-4"><div className="flex gap-3"><Skeleton className="h-9 w-9 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div></section>
          <section aria-hidden className="space-y-3 rounded-lg border border-border bg-card p-4"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-1/2" /></section>
        </div>
      ) : (
        <Detail item={item} selection={selection} regiaoId={regiaoId} visualConfig={actionVisualConfig} onRelated={openRelated} onFocus={onFocus} onDossie={onDossie} />
      )}
    </div>
  ) : null

  return <ViewSwap view={selection ? 'detail' : 'list'} views={{ list: listView, detail: detailView }} />
}

function Detail({ item, selection, regiaoId, visualConfig, onRelated, onFocus, onDossie }: { item: ConsultaItem; selection: ConsultaSelection; regiaoId?: number; visualConfig?: LayerVisualConfig; onRelated: (s: ConsultaSelection) => void; onFocus: (item: ConsultaItem) => void; onDossie: (s: ConsultaSelection) => void }) {
  const action = selection.kind === 'acoes'
  const date = dateText(item)
  const place = placeText(item)
  const properties = item.propriedades ?? []
  const hasGeometry = !!item.geometry
  const relatedList = useConsultaList(listParams({ kind: 'acoes', query: '', bounds: null, regiaoId, propriedadeId: action ? undefined : item.id }), !action)

  return (
    <>
      {/* a mesma anatomia do cartão de hover da ação (13.4): ícone à esquerda e, ao lado, tudo no mesmo eixo */}
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <Mark item={item} kind={selection.kind} visualConfig={visualConfig} />
          <div className="min-w-0 flex-1">
            <h4 className="break-words text-sm font-semibold leading-snug">{tidyText(item.nome)}</h4>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{action ? areaText(item) || 'Ação' : 'Propriedade rural'}</p>
            {action && item.status && (
              <p className="mt-3 flex items-center gap-2 text-sm">
                {item.status}
                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: actionStyle(item, visualConfig).color || 'var(--color-primary)' }} />
              </p>
            )}
            {action && date && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">Registrada em {date}</p>}
          </div>
        </div>
      </section>

      {!action && (item.titular || item.car || item.area != null) && (
        <PanelCard title="Sobre a propriedade">
          <dl className="space-y-3">
            {item.titular && <div><dt className="text-xs text-muted-foreground">Titular</dt><dd className="text-sm">{tidyText(item.titular)}</dd></div>}
            {item.area != null && <div><dt className="text-xs text-muted-foreground">Tamanho</dt><dd className="text-sm">{item.area.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} hectares</dd></div>}
            {item.car && <div><dt className="text-xs text-muted-foreground">Número do CAR</dt><dd className="break-all text-sm">{item.car}</dd></div>}
          </dl>
        </PanelCard>
      )}

      <PanelCard title="Onde fica">
        <dl className="space-y-3">
          <div>
            <dt className="text-xs text-muted-foreground">Município</dt>
            <dd className="text-sm">{place || 'Não informado'}</dd>
          </div>
          {!!item.bacias?.length && (
            <div>
              <dt className="text-xs text-muted-foreground">{action ? 'Bacia' : 'Bacia que cruza a propriedade'}</dt>
              <dd className="text-sm">{item.bacias.map(tidyText).join(' · ')}</dd>
            </div>
          )}
          {action && (
            <div>
              <dt className="text-xs text-muted-foreground">{properties.length > 1 ? 'Propriedades' : 'Propriedade'}</dt>
              <dd>
                {properties.length ? (
                  <ul className="-mx-2">
                    {properties.map((p) => (
                      <li key={p.id}>
                        <button type="button" onClick={() => onRelated({ kind: 'propriedades', id: p.id })} className="group flex min-h-10 w-full items-center justify-between gap-2 rounded-sm px-2 text-left text-sm font-medium text-primary transition-colors duration-200 hover:bg-secondary focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30">
                          <span className="min-w-0 truncate">{tidyText(p.nome)}</span>
                          <ChevronRight className="h-4 w-4 shrink-0 transition-[translate] duration-200 ease-spring group-hover:translate-x-0.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm">Nenhuma propriedade identificada neste ponto.</span>
                )}
              </dd>
            </div>
          )}
        </dl>
      </PanelCard>

      {action && item.descricao && (
        <PanelCard title="Sobre a ação">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.descricao}</p>
        </PanelCard>
      )}

      {/* os dois caminhos de saída, lado a lado: ver onde fica e abrir tudo (19.2: botões em duas colunas) */}
      <div className="grid grid-cols-2 gap-2 pt-4">
        <Button variant="outline" aria-disabled={!hasGeometry} title={hasGeometry ? undefined : 'Este registro não tem localização cadastrada.'} onClick={() => { if (hasGeometry) onFocus(item) }}>
          <MapPin className="h-4 w-4" aria-hidden />
          Ver no mapa
        </Button>
        <Button onClick={() => onDossie(selection)}>
          Abrir dossiê
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {!action && (
        <ListCard title="Ações nesta propriedade" caption="As últimas registradas vêm primeiro.">
          <Results list={relatedList} kind="acoes" visualConfig={visualConfig} onSelect={onRelated} empty={{ title: 'Nenhuma ação aqui ainda', phrase: 'Quando uma ação for registrada nesta propriedade, ela aparece aqui.' }} />
        </ListCard>
      )}
    </>
  )
}
