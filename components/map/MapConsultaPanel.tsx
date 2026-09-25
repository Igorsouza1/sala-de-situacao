'use client'

import { createContext, useContext, useEffect, useRef, useState, type ComponentType } from 'react'
import { ArrowLeft, ArrowUpRight, CalendarDays, ChevronRight, ClipboardList, House, Loader2, MapPin, PanelLeftClose, Search, X } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { ConsultaBounds, ConsultaItem, ConsultaKind, ConsultaSelection } from '@/types/map-consulta'
import type { LayerVisualConfig } from '@/types/map-dto'
import { resolveFeatureStyle, toPascalCase } from './helpers/map-visuals'
import { useConsultaList } from './useConsultaList'
import styles from './MapConsultaPanel.module.css'

const ActionVisualContext = createContext<LayerVisualConfig | undefined>(undefined)

function ActionSymbol({ item }: { item: ConsultaItem }) {
  const config = useContext(ActionVisualContext)
  const visual = resolveFeatureStyle({ baseStyle: config?.baseStyle || config, rules: config?.rules }, { properties: item })
  const Icon = (LucideIcons as unknown as Record<string, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>>)[toPascalCase(visual.iconName || 'map-pin')] || MapPin
  return <span className={`${styles.symbol} ${styles.symbolAction}`} style={{ color: visual.color }} title={item.eixo_tematico || item.categoria || 'Ação'}><Icon size={21} aria-hidden={true} /></span>
}

interface Props {
  regiaoId?: number
  regionName?: string
  actionVisualConfig?: LayerVisualConfig
  open: boolean
  onOpenChange: (open: boolean) => void
  selection: ConsultaSelection | null
  onSelect: (selection: ConsultaSelection | null) => void
  onFocus: (item: ConsultaItem) => void
  getBounds: () => ConsultaBounds | null
  onDossie: (selection: ConsultaSelection) => void
}
const button = 'min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] disabled:opacity-50'
function dateLabel(value: string | null) {
  if (!value) return 'Data não informada'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Data não informada' : date.toLocaleDateString('pt-BR')
}
function location(item: ConsultaItem) {
  const municipalities = item.municipio ? [item.municipio] : item.propriedades?.map(p => p.municipio).filter(Boolean) ?? []
  return [...new Set(municipalities)].join(' · ')
}
function ResultRow({ item, kind, onSelect }: { item: ConsultaItem; kind: ConsultaKind; onSelect: Props['onSelect'] }) {
  const propertyNames = [...new Set(item.propriedades?.map(p => p.nome) ?? [])]
  return <button onClick={() => onSelect({ kind, id: item.id })} className={styles.result}>
    <span className={styles.resultTop}>
      {kind === 'acoes' ? <ActionSymbol item={item} /> : <span className={styles.symbol}><House size={21} aria-hidden /></span>}
      <span className="min-w-0 flex-1">
        <span className={styles.category}>{kind === 'acoes' ? [item.categoria || 'Ação', item.eixo_tematico].filter(Boolean).join(' · ') : 'Propriedade rural'}</span>
        <span className={styles.resultName}>{item.nome}</span>
      </span>
      <ChevronRight size={16} className={styles.chevron} aria-hidden />
    </span>
    <span className={styles.location}>
      {kind === 'acoes' && <span className={styles.locationLine}><House size={14} aria-hidden /><span><span className={styles.locationLabel}>{propertyNames.length > 1 ? 'Propriedades' : 'Propriedade'}</span><span className={styles.locationValue}>{propertyNames.join(' · ') || 'Não identificada'}</span></span></span>}
      <span className={styles.locationLine}><MapPin size={14} aria-hidden /><span><span className={styles.locationLabel}>Município</span><span className={styles.locationValue}>{location(item) || 'Não informado'}</span></span></span>
      {kind === 'propriedades' && item.titular && <span><span className={styles.locationLabel}>Titular</span><span className={styles.locationValue}>{item.titular}</span></span>}
    </span>
    {kind === 'acoes' && <span className={styles.date}><CalendarDays size={13} aria-hidden />Atividade em {dateLabel(item.data)}</span>}
  </button>
}
function Results({ result, kind, onSelect }: { result: ReturnType<typeof useConsultaList>; kind: ConsultaKind; onSelect: Props['onSelect'] }) {
  return <>
    {result.items.map(item => <ResultRow key={item.id} item={item} kind={kind} onSelect={onSelect} />)}
    {result.loading && <p role="status" className="flex items-center justify-center gap-2 p-6 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" />Carregando…</p>}
    {result.error && <div role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{result.error}<button className={`${button} block underline`} onClick={result.retry}>Tentar novamente</button></div>}
    {!result.loading && !result.error && !result.items.length && <p className="px-5 py-10 text-center text-sm text-slate-500">Nenhum resultado encontrado. Tente outro nome ou amplie a consulta.</p>}
    {result.hasMore && !result.error && <div className="p-4"><button className={`${button} w-full border border-slate-200 text-slate-700 hover:bg-slate-50`} disabled={result.loading} onClick={result.loadMore}>Carregar mais</button></div>}
  </>
}
function PropertyActions({ id, regiaoId, onSelect }: { id: number; regiaoId?: number; onSelect: Props['onSelect'] }) {
  const params = new URLSearchParams({ kind: 'acoes', propriedade_id: String(id) })
  if (regiaoId) params.set('regiao_id', String(regiaoId))
  const result = useConsultaList(params.toString())
  return <section className="mt-5 border-t border-slate-200"><h3 className="px-4 pt-5 text-sm font-semibold">Ações nesta Propriedade</h3><p className="px-4 pb-1 pt-1 text-xs text-slate-500">Últimas registradas · todo o histórico</p><Results result={result} kind="acoes" onSelect={onSelect} /></section>
}

export function MapConsultaPanel(props: Props) {
  const { regiaoId, selection, onSelect, onFocus } = props
  const [kind, setKind] = useState<ConsultaKind>('acoes')
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [bounds, setBounds] = useState<ConsultaBounds | null>(null)
  const [detail, setDetail] = useState<ConsultaItem | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const cache = useRef(new Map<string, ConsultaItem>())
  const history = useRef<ConsultaSelection[]>([])
  const internalNavigation = useRef<ConsultaSelection | null>(null)
  const params = new URLSearchParams({ kind, q: query })
  if (regiaoId) params.set('regiao_id', String(regiaoId))
  if (bounds) params.set('bbox', bounds.join(','))
  const result = useConsultaList(params.toString())

  useEffect(() => {
    if (selection !== internalNavigation.current) history.current = []
    internalNavigation.current = null
    setDetail(null)
    setDetailError(null)
    if (!selection) return
    const abort = new AbortController()
    const key = `${selection.kind}:${selection.id}`
    const cached = cache.current.get(key)
    if (cached) { setDetail(cached); onFocus(cached); return }
    const search = new URLSearchParams({ kind: selection.kind, id: String(selection.id) })
    if (regiaoId) search.set('regiao_id', String(regiaoId))
    fetch(`/api/map/consulta?${search}`, { signal: abort.signal }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível abrir o registro.')
      if (abort.signal.aborted) return
      const item: ConsultaItem = data.items[0]
      cache.current.set(key, item)
      setDetail(item)
      onFocus(item)
    }).catch(error => { if (!abort.signal.aborted) setDetailError(error.message) })
    return () => abort.abort()
  }, [selection?.kind, selection?.id, regiaoId, onFocus, retry])

  function selectRelated(next: ConsultaSelection | null) {
    if (selection) history.current.push(selection)
    internalNavigation.current = next
    onSelect(next)
  }
  return <ActionVisualContext.Provider value={props.actionVisualConfig}><aside aria-label="Consulta de Ações e Propriedades" className={`${styles.panel} absolute left-4 top-4 z-[1000] ${props.open ? 'bottom-24 flex w-[360px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-[18px] border border-black/[.08] bg-white max-sm:bottom-auto max-sm:max-h-[65%]' : ''}`}>
    {!props.open && <button className={`${button} flex items-center gap-2 border border-slate-200 bg-white text-[#0066cc]`} onClick={() => props.onOpenChange(true)} aria-expanded={false}><Search size={18} />Consultar</button>}
    <div className={props.open ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
      <header className={`${styles.header} shrink-0`}>
        <div><h2 className={styles.heading}>Explore a Região</h2><p className={styles.region}>{props.regionName || 'Região selecionada'}</p></div>
        <button className={styles.collapse} title="Recolher consulta" aria-label="Recolher consulta" aria-expanded={true} onClick={() => props.onOpenChange(false)}><PanelLeftClose size={20} /></button>
      </header>
      {/* A lista permanece montada para preservar a busca, os resultados e o scroll. */}
      <div className={selection ? 'hidden' : 'flex min-h-0 flex-1 flex-col'}>
        <div className="shrink-0 px-5 pb-3">
          <div className={styles.tabs} aria-label="Tipo de consulta">
            {(['acoes', 'propriedades'] as const).map(tab => <button key={tab} aria-pressed={kind === tab} className={styles.tab} onClick={() => { setKind(tab); setDraft(''); setQuery('') }}>{tab === 'acoes' ? <ClipboardList size={16} aria-hidden /> : <House size={16} aria-hidden />}{tab === 'acoes' ? 'Ações' : 'Propriedades'}</button>)}
          </div>
          <form className={styles.search} onSubmit={event => { event.preventDefault(); setQuery(draft.trim()) }}>
            <label htmlFor="map-consulta-search" className={styles.searchLabel}>{kind === 'acoes' ? 'Encontre uma Ação' : 'Encontre uma Propriedade'}</label>
            <div className={styles.searchField}><Search size={16} aria-hidden />
              <input id="map-consulta-search" aria-label={kind === 'acoes' ? 'Buscar ações' : 'Buscar propriedades por nome, CAR ou titular'} value={draft} onChange={event => setDraft(event.target.value)} placeholder={kind === 'acoes' ? 'Nome, tipo ou Propriedade' : 'Nome, CAR ou titular'} maxLength={150} />
              <button type="submit" className={styles.searchSubmit}>Buscar</button>
            </div>
          </form>
          <div className="flex items-center justify-between gap-2 text-xs">
            <button className={styles.scopeButton} onClick={() => { const area = props.getBounds(); if (area) setBounds(area) }}><MapPin size={13} />Buscar nesta área do mapa</button>
            {(bounds || query) && <button className="flex items-center gap-1 text-slate-500 hover:underline" onClick={() => { setBounds(null); setQuery(''); setDraft('') }}><X size={12} />Limpar busca</button>}
          </div>
        </div>
        <div className={`${styles.resultsHeading} shrink-0`}><h3>{query ? `Resultados para “${query}”` : kind === 'acoes' ? 'Ações da Região' : 'Propriedades da Região'}</h3><p>{kind === 'acoes' ? 'Últimas registradas primeiro · todo o histórico' : 'Em ordem alfabética'}{bounds ? ' · Área delimitada' : ''}</p></div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-busy={result.loading}><Results result={result} kind={kind} onSelect={next => { history.current = []; onSelect(next) }} /></div>
      </div>
      {selection && <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <button className={`${button} m-2 flex items-center gap-2 text-slate-600 hover:bg-slate-100`} onClick={() => { const previous = history.current.pop() ?? null; internalNavigation.current = previous; onSelect(previous) }}><ArrowLeft size={16} />{history.current.length ? 'Voltar' : 'Resultados'}</button>
        {detailError ? <div role="alert" className="p-4 text-sm text-red-700">{detailError}<button className={`${button} block underline`} onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></div> : !detail ? <p role="status" className="p-6 text-sm text-slate-500">Carregando detalhes…</p> : <>
          <div className="space-y-4 px-4 pb-2">
            <div className={styles.detailTitle}>{selection.kind === 'acoes' ? <ActionSymbol item={detail} /> : <span className={styles.symbol}><House size={21} aria-hidden /></span>}<div><p className={styles.category}>{selection.kind === 'acoes' ? detail.categoria || 'Ação' : 'Propriedade rural'}</p><h3 className={styles.detailName}>{detail.nome}</h3></div></div>
            {selection.kind === 'acoes' && <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-md bg-slate-100 px-2 py-1">Atividade em {dateLabel(detail.data)}</span>{detail.status && <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">{detail.status}</span>}</div>}
            <section className={`${styles.detailSection} space-y-4`}>
              <h4 className="flex items-center gap-2 font-semibold"><MapPin size={15} />Localização</h4>
              <p><span className="block text-xs text-slate-500">Município{selection.kind === 'acoes' ? ' da Propriedade' : ''}</span>{location(detail) || 'Não informado'}</p>
              {!!detail.bacias?.length && <p><span className="block text-xs text-slate-500">{selection.kind === 'acoes' ? 'Bacia' : 'Bacia intersectada'}</span>{detail.bacias.join(' · ')}</p>}
              {selection.kind === 'acoes' && <div><span className="block text-xs text-slate-500">Propriedade</span>{detail.propriedades?.length ? detail.propriedades.map(property => <button key={property.id} className="mt-1 flex w-full items-center justify-between gap-2 text-left font-medium text-blue-700 hover:underline" onClick={() => selectRelated({ kind: 'propriedades', id: property.id })}>{property.nome}<ChevronRight size={15} className="shrink-0" /></button>) : <p>Nenhuma Propriedade identificada neste local.</p>}</div>}
              <button className="text-xs font-medium text-blue-700 hover:underline disabled:text-slate-400" disabled={!detail.geometry} onClick={() => onFocus(detail)}>Localizar no mapa</button>
            </section>
            {detail.titular && <p className="text-sm"><span className="block text-xs text-slate-500">Titular</span>{detail.titular}</p>}
            {detail.car && <p className="break-all text-xs text-slate-600"><span className="mb-1 block text-slate-500">CAR</span>{detail.car}</p>}
            {detail.area != null && <p className="text-sm text-slate-600">{detail.area.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} hectares</p>}
            {detail.descricao && <section><h4 className="mb-2 text-sm font-semibold">Sobre a Ação</h4><p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#626267]">{detail.descricao}</p></section>}
            <button className={`${button} flex w-full items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50`} onClick={() => props.onDossie(selection)}>Abrir dossiê completo<ArrowUpRight size={15} /></button>
          </div>
          {selection.kind === 'propriedades' && <PropertyActions key={detail.id} id={detail.id} regiaoId={regiaoId} onSelect={selectRelated} />}
        </>}
      </div>}
    </div>
  </aside></ActionVisualContext.Provider>
}
