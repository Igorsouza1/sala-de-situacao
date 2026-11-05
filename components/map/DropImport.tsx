'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChartColumnStacked, CircleCheck, FileUp, ListChecks, Palette, TriangleAlert, UploadCloud, X } from 'lucide-react'
import type { FeatureCollection } from 'geojson'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFileDrop } from '@/hooks/useFileDrop'
import { useRegion } from '@/context/RegionContext'
import { cn } from '@/lib/utils'
import { colorFromFile, isSidecarFile, kindOfFile, nameFromFile } from '@/lib/geo-import/files'
import { MAX_MB, problemMessage, readGeoJson, type GeoJsonSummary } from '@/lib/geo-import/geojson'
import { RasterProblemError, convertRaster, inspectRaster, rasterProblemMessage, type RasterConversion, type RasterInfo } from '@/lib/geo-import/raster'
import { groupSeries, shareInside, type Bounds } from '@/lib/geo-import/class-series'
import { SeriesProblemError, convertSeries, inspectSeries, probeClasses, seriesProblemMessage, type SeriesConversion, type SeriesInspection } from '@/lib/geo-import/class-series-read'
import { ZipProblemError, isZip, readZip } from '@/lib/geo-import/zip'
import { SaveLayerError, saveGeoJsonLayer, saveRasterLayer, saveSeriesLayer } from '@/lib/geo-import/upload'
import { controlItem, controlSurface } from './helpers/control-style'
import { ClassSeriesView } from './ClassSeries'
import { ColorField } from './LayerEditor'
import { PanelCard } from './PanelCard'
import type { NoticeData } from './Notice'
import type { RasterSpec } from './RasterLayers'

// Soltar um arquivo no mapa (DESIGN.md 2.1 e 13): a pessoa arrasta, o mapa mostra o que veio ANTES de gravar, e só então ela salva.
// Estados desenhados: lendo (esqueleto), preparando (raster: barra de andamento), pronto (prévia no mapa), salvando (barra),
// erro (o que ela preencheu fica) e arquivo que não serve (diz o que fazer). A tela pensa pela pessoa: nome e cor já vêm
// sugeridos pelo nome do arquivo e o campo de ano é achado sozinho. Vários arquivos soltos de uma vez viram uma fila, um cartão por vez.
// Uma SÉRIE DE ANOS (um raster de classes por ano, ex.: o uso do solo do MapBiomas, solta como pasta ou como vários arquivos)
// vira UM cartão: a tela confere a série (anos, grade, região, legenda), mostra o gráfico da divisão da área e a prévia de um ano
// no mapa, e só então a pessoa salva. Os auxiliares que vêm junto (.aux.xml) são ignorados em silêncio.

export type ImportPreview =
  | { kind: 'vetor'; data: FeatureCollection; color: string }
  | { kind: 'raster'; spec: RasterSpec }

interface DropImportProps {
  regiaoId: number | null
  /** quem só lê vê a prévia, mas não salva (o motivo aparece ao lado do botão) */
  canEdit: boolean
  mapRef: React.RefObject<any>
  onPreview: (preview: ImportPreview | null) => void
  /** a camada foi gravada: o mapa recarrega o catálogo e liga a camada */
  onSaved: (slug: string) => void
  onNotice: (notice: NoticeData) => void
  /** o cartão está aberto (ocupa o canto esquerdo: o resumo das Ações sai da frente) */
  onActiveChange?: (active: boolean) => void
}

type Item =
  | { kind: 'vetor'; collection: FeatureCollection; summary: GeoJsonSummary }
  | { kind: 'raster'; conversion: RasterConversion }
  | { kind: 'serie'; conversion: SeriesConversion }

/** o que espera a vez na fila: um arquivo, ou os arquivos de uma série de anos (ou um .zip que não abriu, com o motivo) */
type Job = { name: string; files: File[]; problem?: string; /** um .zip ainda sendo aberto */ opening?: boolean }

type Step =
  | { phase: 'lendo' }
  | { phase: 'preparando'; info: RasterInfo | SeriesInspection; fraction: number }
  | { phase: 'problema'; message: string }
  | { phase: 'pronto'; item: Item }
  | { phase: 'salvando'; item: Item; done: number; total: number }
  | { phase: 'erro'; item: Item; message: string }

const NOUN: Record<GeoJsonSummary['kind'], [string, string]> = {
  area: ['área', 'áreas'],
  linha: ['linha', 'linhas'],
  ponto: ['ponto', 'pontos'],
  misto: ['forma', 'formas'],
}

const count = (n: number, [one, many]: [string, string]) => `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`
const period = (a: number, b: number) => (a === b ? `${a}` : `${a} a ${b}`)

function boundsOf(item: Item): [number, number, number, number] {
  return item.kind === 'vetor' ? item.summary.bounds : item.kind === 'serie' ? item.conversion.grid.bounds : item.conversion.bounds
}

const isSeries = (job: Job) => job.files.length > 1
const yearsLabel = (ys: number[]) => (ys.length === 1 ? `${ys[0]}` : `${ys.slice(0, -1).join(', ')} e ${ys[ys.length - 1]}`)
const mb = (bytes: number) => `${(bytes / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`

/** O que foi solto vira a fila: as séries primeiro (um item cada), depois os arquivos soltos. */
function jobsFrom(files: File[]): Job[] {
  const { series, singles } = groupSeries(files.filter((f) => !isSidecarFile(f.name)))
  return [...series.map((g) => ({ name: g[0].name, files: g })), ...singles.map((f) => ({ name: f.name, files: [f] }))]
}

/** Uma linha da conferência: o ícone diz se passou ou se pede atenção, e a frase diz o quê (nunca só a cor). */
function CheckRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? CircleCheck : TriangleAlert
  return (
    <li className="flex gap-2.5">
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', ok ? 'text-ok' : 'text-warn')} aria-hidden />
      <span className="min-w-0 text-sm leading-snug">
        <span className="sr-only">{ok ? 'Conferido: ' : 'Atenção: '}</span>
        {children}
      </span>
    </li>
  )
}

/** A conferência da série: o que passou e o que pede atenção, cada coisa numa frase com o próximo passo. */
function SeriesChecks({ c, region }: { c: SeriesConversion; region: { bbox: Bounds; nome: string | null } | null }) {
  const inside = region ? shareInside(c.grid.bounds, region.bbox) : null
  const where = region?.nome ? `de ${region.nome}` : 'aberta no mapa'
  const adjusted = c.adjusted.map((a) => a.year)
  const finer = c.adjusted.some((a) => a.finer)
  const single = c.years.length === 1
  return (
    <ul className="space-y-3">
      {single ? (
        <CheckRow ok>O ano {c.years[0].year}, achado no nome do arquivo. Para ver a mudança ao longo do tempo, solte a pasta ou o .zip com todos os anos.</CheckRow>
      ) : c.missing.length ? (
        <CheckRow ok={false}>Faltam {yearsLabel(c.missing)}. O gráfico e o mapa pulam {c.missing.length === 1 ? 'esse ano' : 'esses anos'}.</CheckRow>
      ) : (
        <CheckRow ok>{c.years.length} anos seguidos, um arquivo por ano.</CheckRow>
      )}
      {single ? null : adjusted.length ? (
        <CheckRow ok={false}>
          {yearsLabel(adjusted)} {adjusted.length === 1 ? 'veio' : 'vieram'} {finer ? 'com mais detalhe' : 'com outro tamanho de pixel'} que os outros anos, provavelmente de
          outra exportação. Ajustamos à grade dos outros para comparar; uma mudança que só aparece {adjusted.length === 1 ? `em ${adjusted[0]}` : 'nesses anos'} pode vir disso.
        </CheckRow>
      ) : (
        <CheckRow ok>Todos os anos na mesma grade.</CheckRow>
      )}
      {inside !== null &&
        (inside >= 0.9 ? (
          <CheckRow ok>Dentro da região {where}.</CheckRow>
        ) : inside > 0 ? (
          <CheckRow ok={false}>Parte do raster fica fora da região {where}. Confira se é a área certa.</CheckRow>
        ) : (
          <CheckRow ok={false}>O raster fica fora da região {where}. Confira se é a área certa antes de salvar.</CheckRow>
        ))}
      {c.mapbiomas ? (
        <CheckRow ok>Classes do MapBiomas, com os nomes e as cores oficiais.</CheckRow>
      ) : (
        <CheckRow ok={false}>Algumas classes não estão na legenda do MapBiomas e aparecem como “Classe” seguida do número.</CheckRow>
      )}
      <CheckRow ok>
        {single
          ? `Guardamos compactado: os ${mb(c.sourceBytes)} do arquivo viram ${mb(c.data.size)}.`
          : `Guardamos só o que muda de um ano para o outro: os ${mb(c.sourceBytes)} dos arquivos viram ${mb(c.data.size)}.`}
      </CheckRow>
    </ul>
  )
}

export function DropImport({ regiaoId, canEdit, mapRef, onPreview, onSaved, onNotice, onActiveChange }: DropImportProps) {
  const [queue, setQueue] = useState<Job[]>([])
  const [step, setStep] = useState<Step>({ phase: 'lendo' })
  const [name, setName] = useState('')
  const [color, setColor] = useState(() => colorFromFile(''))
  /** série de anos: o ano que a prévia mostra no mapa */
  const [previewYear, setPreviewYear] = useState<number | null>(null)
  const { region } = useRegion()
  const [entered, setEntered] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const file = queue[0] as Job | undefined
  const hasFile = !!file
  // quem chama pode passar uma função nova a cada render: a limpeza da prévia não pode depender da identidade dela
  const previewRef = useRef(onPreview)
  previewRef.current = onPreview

  // um .zip é aberto aqui e vale como a pasta que ele guarda (a série costuma chegar zipada do Google Drive)
  // Enquanto abre, o cartão já aparece dizendo "Abrindo…" (um item provisório na fila, trocado pelo que veio de dentro).
  const dragging = useFileDrop(async (dropped) => {
    const zips = dropped.filter((f) => isZip(f.name))
    if (!zips.length) { setQueue((q) => [...q, ...jobsFrom(dropped)]); return }
    const opening: Job = { name: zips[0].name, files: [], opening: true }
    setQueue((q) => [...q, opening])
    const files = dropped.filter((f) => !isZip(f.name))
    const problems: Job[] = []
    for (const z of zips) {
      try {
        files.push(...(await readZip(z)))
      } catch (e) {
        problems.push({ name: z.name, files: [z], problem: e instanceof ZipProblemError ? e.message : `Não conseguimos abrir “${z.name}”.` })
      }
    }
    // se a pessoa descartou enquanto abria, o provisório já saiu da fila e nada entra
    setQueue((q) => q.flatMap((j) => (j === opening ? [...jobsFrom(files), ...problems] : [j])))
  })

  // chega a vez de um arquivo (ou de uma série): lê, confere e mostra a prévia (nada é gravado ainda)
  useEffect(() => {
    if (!file) { setStep({ phase: 'lendo' }); return } // a fila esvaziou: nada do arquivo anterior fica
    let alive = true
    setStep({ phase: 'lendo' })
    setName(nameFromFile(file.name))
    setColor(colorFromFile(file.name))
    setPreviewYear(null)
    setLeaving(false)

    if (file.opening) return // fica em "lendo" até o .zip abrir
    if (file.problem) {
      setStep({ phase: 'problema', message: file.problem })
      return
    }

    // uso do solo (classes): um arquivo ou vários, sempre o mesmo caminho, com as cores da legenda e sem pedir cor
    const runSeries = async (files: File[]) => {
      try {
        const insp = await inspectSeries(files)
        if (!alive) return
        setName(insp.name)
        setStep({ phase: 'preparando', info: insp, fraction: 0 })
        const conversion = await convertSeries(insp, (fraction) => alive && setStep({ phase: 'preparando', info: insp, fraction }))
        if (!alive) return
        setPreviewYear(conversion.years[conversion.years.length - 1].year)
        setStep({ phase: 'pronto', item: { kind: 'serie', conversion } })
      } catch (e) {
        if (!alive) return
        setStep({ phase: 'problema', message: e instanceof SeriesProblemError ? e.message : seriesProblemMessage({ code: 'ilegivel', file: file.name }) })
      }
    }

    if (isSeries(file)) {
      runSeries(file.files)
      return () => { alive = false }
    }

    const single = file.files[0]
    const kind = kindOfFile(single.name)
    if (kind === 'desconhecido') {
      setStep({ phase: 'problema', message: `“${single.name}” não é um formato que o mapa lê. Use GeoJSON (.geojson), raster (.tif) ou um .zip com eles.` })
      return
    }

    if (kind === 'raster') {
      ;(async () => {
        try {
          const info = await inspectRaster(single)
          if (!alive) return
          // um raster de uma banda pode ser de classes (um ano de uso do solo): a tela vê pelos valores, não pelo jeito que chegou
          if (info.mode === 'valores' && (await probeClasses(single))) {
            if (alive) await runSeries([single])
            return
          }
          if (!alive) return
          setStep({ phase: 'preparando', info, fraction: 0 })
          const conversion = await convertRaster(single, info, (fraction) => alive && setStep({ phase: 'preparando', info, fraction }))
          if (alive) setStep({ phase: 'pronto', item: { kind: 'raster', conversion } })
        } catch (e) {
          if (!alive) return
          setStep({ phase: 'problema', message: e instanceof RasterProblemError ? e.message : rasterProblemMessage({ code: 'ilegivel' }) })
        }
      })()
      return () => { alive = false }
    }

    if (single.size > MAX_MB * 1024 * 1024) {
      setStep({ phase: 'problema', message: problemMessage({ code: 'grande-demais', mb: Math.round(single.size / 1024 / 1024) }) })
      return
    }
    single.text().then(
      (text) => {
        if (!alive) return
        const reading = readGeoJson(text)
        setStep(reading.ok ? { phase: 'pronto', item: { kind: 'vetor', collection: reading.collection, summary: reading.summary } } : { phase: 'problema', message: problemMessage(reading.problem) })
      },
      () => alive && setStep({ phase: 'problema', message: problemMessage({ code: 'json-invalido' }) }),
    )
    return () => { alive = false }
  }, [file])

  const activeRef = useRef(onActiveChange)
  activeRef.current = onActiveChange
  useEffect(() => { activeRef.current?.(hasFile) }, [hasFile])

  // o cartão cresce ao entrar (8.1): um quadro depois de montado
  useEffect(() => {
    if (!hasFile) { setEntered(false); return }
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [hasFile])

  // a prévia no mapa acompanha o que a pessoa vê no cartão (inclusive a cor, ao vivo)
  // Sem arquivo na fila (descartou ou salvou), não há prévia: o último passo fica guardado em `step` até chegar outro arquivo,
  // e era ele que mantinha a prévia no mapa depois do Descartar.
  const item = file && (step.phase === 'pronto' || step.phase === 'salvando' || step.phase === 'erro') ? step.item : null
  useEffect(() => {
    if (!item) { previewRef.current(null); return }
    if (item.kind === 'vetor') { previewRef.current({ kind: 'vetor', data: item.collection, color }); return }
    if (item.kind === 'serie') {
      // a prévia é a própria série que vai ser salva, aberta como o mapa a abrirá depois
      const c = item.conversion
      const seriesYears = c.years.map((y) => y.year)
      const year = previewYear ?? seriesYears[seriesYears.length - 1]
      previewRef.current({
        kind: 'raster',
        spec: { key: 'preview', source: c.data, bounds: c.grid.bounds, width: c.grid.width, height: c.grid.height, mode: 'classes', max: 1, color, firstYear: seriesYears[0], seriesYears, years: [year, year] },
      })
      return
    }
    const c = item.conversion
    previewRef.current({
      kind: 'raster',
      spec: { key: 'preview', source: c.png, bounds: c.bounds, width: c.width, height: c.height, mode: c.mode, max: c.max, color, firstYear: c.firstYear },
    })
  }, [item, color, previewYear])
  useEffect(() => () => previewRef.current(null), [])

  // enquadra o que chegou, deixando o cartão (à esquerda) fora da área da câmera
  const fitTo = item ? boundsOf(item) : null
  useEffect(() => {
    const map = mapRef.current
    if (!fitTo || !map) return
    const [w, s, e, n] = fitTo
    const wide = map.getContainer().clientWidth >= 640
    map.fitBounds([[w, s], [e, n]], {
      padding: { top: 80, bottom: 110, left: wide ? 420 : 40, right: wide ? 80 : 40 },
      maxZoom: 16,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1000,
    })
  // só quando chega um arquivo novo (os limites mudam), não a cada letra do nome
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitTo?.join(',')])

  // sai encolhendo e some (150 ms); o próximo arquivo da fila, se houver, ocupa o cartão
  const finish = useCallback(() => {
    setLeaving(true)
    window.setTimeout(() => setQueue((q) => q.slice(1)), 150)
  }, [])

  const save = useCallback(async () => {
    if (step.phase !== 'pronto' && step.phase !== 'erro') return
    if (!regiaoId) return
    const current = step.item
    const label = name.trim()
    try {
      let slug: string
      if (current.kind === 'vetor') {
        const { collection, summary } = current
        setStep({ phase: 'salvando', item: current, done: 0, total: collection.features.length })
        ;({ slug } = await saveGeoJsonLayer(
          {
            name: label,
            color,
            regiaoId,
            kind: summary.kind,
            dateField: summary.dateField,
            yearField: summary.yearField,
            years: summary.years,
            features: collection.features,
          },
          (done, total) => setStep({ phase: 'salvando', item: current, done, total }),
        ))
      } else if (current.kind === 'serie') {
        const c = current.conversion
        setStep({ phase: 'salvando', item: current, done: 0, total: 1 })
        ;({ slug } = await saveSeriesLayer({
          name: label,
          regiaoId,
          width: c.grid.width,
          height: c.grid.height,
          bounds: c.grid.bounds,
          years: c.years.map((y) => y.year),
          stats: c.stats,
          mapbiomas: c.mapbiomas,
          data: c.data,
        }))
      } else {
        const c = current.conversion
        setStep({ phase: 'salvando', item: current, done: 0, total: 1 })
        ;({ slug } = await saveRasterLayer({
          name: label, color, regiaoId, mode: c.mode, width: c.width, height: c.height, bounds: c.bounds, bands: c.bands, firstYear: c.firstYear, max: c.max, png: c.png,
        }))
      }
      onSaved(slug)
      onNotice({ id: Date.now(), tone: 'success', title: 'Camada salva', body: `“${label}” já está no painel Camadas.` })
      finish()
    } catch (e) {
      const err = e instanceof SaveLayerError ? e : null
      const tail = err ? (err.undone ? 'Nada foi salvo.' : 'Se a camada aparecer pela metade, apague-a no painel Camadas.') : ''
      setStep({ phase: 'erro', item: current, message: `${err?.message ?? 'Não foi possível salvar.'} ${tail} O que você preencheu continua aqui.`.replace(/\s+/g, ' ').trim() })
    }
  }, [step, regiaoId, name, color, onSaved, onNotice, finish])

  // Esc descarta (o mesmo que Descartar); não vale durante o envio
  useEffect(() => {
    if (!file) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && step.phase !== 'salvando') finish() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [file, step.phase, finish])

  const blocked = !canEdit
    ? 'Seu perfil só vê a prévia. Fale com o administrador para salvar.'
    : !regiaoId
      ? 'Escolha uma região para poder salvar.'
      : !name.trim()
        ? 'Dê um nome à camada para salvar.'
        : null
  const saving = step.phase === 'salvando'

  return (
    <>
      {/* Aviso de soltar: cobre o mapa enquanto há arquivos sobre a janela. Não captura o mouse (o soltar é tratado na janela). */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-3 z-[1100] flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-secondary/70 transition-[opacity,scale] duration-[260ms]',
          dragging ? 'scale-100 opacity-100 ease-spring' : 'scale-[0.98] opacity-0 ease-in',
        )}
      >
        <div className={cn('flex max-w-sm flex-col items-center gap-2 rounded-lg px-6 py-5 text-center', controlSurface)}>
          <UploadCloud className="h-8 w-8 text-primary" aria-hidden />
          <p className="text-base font-semibold">Solte para adicionar ao mapa</p>
          <p className="text-sm text-muted-foreground">
            GeoJSON ou raster (.tif). Pode soltar vários de uma vez, ou a pasta de uma série de anos.
            {!canEdit && ' Você verá a prévia, mas só editores salvam.'}
          </p>
        </div>
      </div>
      <p role="status" className="sr-only">{dragging ? 'Solte o arquivo para adicioná-lo ao mapa.' : ''}</p>

      {file && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Nova camada"
          className={cn(
            'absolute left-4 top-16 z-[600] flex max-h-[calc(100svh-9rem)] w-[22rem] max-w-[calc(100vw-2rem)] origin-top-left flex-col overflow-hidden rounded-lg transition-[opacity,scale,translate] max-sm:inset-x-3 max-sm:left-3 max-sm:w-auto',
            controlSurface,
            entered && !leaving ? 'translate-y-0 scale-100 opacity-100 duration-[260ms] ease-spring' : '-translate-y-1 scale-95 opacity-0 duration-150 ease-in',
          )}
        >
          <header className="flex items-center justify-between gap-2 border-b border-border py-2.5 pl-5 pr-3">
            <h3 className="whitespace-nowrap text-base font-semibold">Nova camada</h3>
            <button
              type="button"
              aria-label="Descartar e fechar"
              onClick={finish}
              disabled={saving}
              className={cn('flex h-8 w-8 items-center justify-center disabled:pointer-events-none disabled:opacity-40', controlItem())}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-muted/50 p-4 pb-6">
            {step.phase === 'lendo' && (
              <PanelCard
                title={file.opening ? 'Abrindo o .zip…' : isSeries(file) ? `Lendo ${file.files.length} arquivos…` : 'Lendo o arquivo…'}
                caption={file.name}
                icon={FileUp}
              >
                <div className="space-y-2" aria-hidden>
                  <div className="h-4 w-3/4 rounded-sm bg-shimmer" />
                  <div className="h-4 w-1/2 rounded-sm bg-shimmer" />
                </div>
              </PanelCard>
            )}

            {step.phase === 'preparando' && (
              <PanelCard title={isSeries(file) ? 'Preparando a série…' : 'Preparando o raster…'} caption={file.name} icon={FileUp}>
                <div role="status" aria-live="polite">
                  <p className="mb-2 text-sm">
                    {'years' in step.info
                      ? `Lendo ${step.info.years.length} anos e conferindo cada um.`
                      : step.info.mode === 'bandas'
                        ? `Lendo ${step.info.bands} anos de dados.`
                        : 'Lendo os valores.'}{' '}
                    Pode levar alguns segundos.
                  </p>
                  <div className="h-2 overflow-hidden rounded-full bg-border" aria-hidden>
                    <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${Math.round(step.fraction * 100)}%` }} />
                  </div>
                </div>
              </PanelCard>
            )}

            {step.phase === 'problema' && (
              <PanelCard
                title={isSeries(file) ? 'Esta série não entrou' : 'Este arquivo não entrou'}
                caption={isSeries(file) ? `${file.files.length} arquivos, a partir de ${file.name}` : file.name}
                icon={TriangleAlert}
              >
                <p role="alert" className="text-sm">{step.message}</p>
              </PanelCard>
            )}

            {item && (
              <>
                <PanelCard
                  title="O que encontramos"
                  caption={`${isSeries(file) ? `${file.files.length} arquivos` : file.name}${queue.length > 1 ? ` · item 1 de ${queue.length}` : ''}`}
                  icon={item.kind === 'serie' ? ListChecks : FileUp}
                >
                  {item.kind === 'serie' ? (
                    <>
                      <p className="mb-4 text-sm">
                        <strong className="font-semibold">Uso do solo</strong>
                        {item.conversion.years.length === 1
                          ? ` de ${item.conversion.years[0].year}`
                          : `, um mapa por ano, de ${period(item.conversion.years[0].year, item.conversion.years[item.conversion.years.length - 1].year)}`}
                        , com {item.conversion.stats.classes.length} {item.conversion.stats.classes.length === 1 ? 'classe' : 'classes'}. Cada classe já vem com a sua cor.
                      </p>
                      <SeriesChecks c={item.conversion} region={region ? { bbox: region.bbox, nome: region.nome } : null} />
                    </>
                  ) : item.kind === 'vetor' ? (
                    <>
                      <p className="text-sm">
                        <strong className="font-semibold">{count(item.summary.count, NOUN[item.summary.kind])}</strong>
                        {item.summary.years && <> de {period(item.summary.years[0], item.summary.years[1])}</>}.
                      </p>
                      <p className="mt-1 text-xs leading-snug text-muted-foreground">
                        {item.summary.years
                          ? `Vamos usar o campo “${item.summary.dateField ?? item.summary.yearField}” para o filtro de ano.`
                          : 'Os dados não trazem ano nem data, então a camada aparece sempre inteira.'}
                      </p>
                    </>
                  ) : item.conversion.mode === 'bandas' ? (
                    <>
                      <p className="text-sm">
                        <strong className="font-semibold">Um mapa por ano</strong>, de {period(item.conversion.firstYear!, item.conversion.firstYear! + item.conversion.bands - 1)}.
                      </p>
                      <p className="mt-1 text-xs leading-snug text-muted-foreground">Depois de salvar, você escolhe o período no mapa. Vários anos mostram quantas vezes cada ponto queimou.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm"><strong className="font-semibold">Uma camada de valores</strong>, do mais claro ao mais cheio.</p>
                      <p className="mt-1 text-xs leading-snug text-muted-foreground">Quanto maior o valor, mais cheia a cor.</p>
                    </>
                  )}
                </PanelCard>

                {item.kind === 'serie' && (
                  <PanelCard
                    title={item.conversion.years.length === 1 ? 'Como a área se divide' : 'Como a área mudou'}
                    caption={item.conversion.years.length === 1 ? 'Quanto da área cada classe ocupa.' : 'Cada barra é um ano. Clique numa barra ou arraste para ver o ano no mapa.'}
                    icon={ChartColumnStacked}
                  >
                    <ClassSeriesView
                      name={name}
                      stats={item.conversion.stats}
                      years={item.conversion.years.map((y) => y.year)}
                      year={previewYear ?? item.conversion.years[item.conversion.years.length - 1].year}
                      onYear={setPreviewYear}
                    />
                  </PanelCard>
                )}

                <PanelCard
                  title="Como vai aparecer"
                  caption={item.kind === 'serie' ? 'A prévia já está no mapa, com a cor de cada classe.' : 'A prévia já está no mapa.'}
                  icon={Palette}
                >
                  <div className="space-y-5">
                    <label className="block">
                      <span className="mb-2 block text-sm">Nome</span>
                      <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} disabled={saving} />
                    </label>
                    {/* a série usa as cores da legenda de cada classe: não há uma cor da camada para escolher */}
                    {item.kind !== 'serie' && (
                      <fieldset disabled={saving} className="min-w-0 border-0 p-0">
                        <ColorField value={color} onChange={setColor} />
                      </fieldset>
                    )}
                  </div>
                </PanelCard>
              </>
            )}

            {step.phase === 'salvando' && (
              <div role="status" aria-live="polite">
                <p className="mb-2 text-sm">
                  {step.item.kind === 'vetor'
                    ? `Salvando… ${step.done.toLocaleString('pt-BR')} de ${step.total.toLocaleString('pt-BR')}`
                    : step.item.kind === 'serie'
                      ? 'Salvando a série…'
                      : 'Salvando o raster…'}
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-border" aria-hidden>
                  <div
                    className={cn('h-full rounded-full bg-primary transition-[width] duration-300 ease-out', step.item.kind !== 'vetor' && 'w-full bg-shimmer')}
                    style={step.item.kind === 'vetor' ? { width: `${step.total ? (step.done / step.total) * 100 : 0}%` } : undefined}
                  />
                </div>
              </div>
            )}

            {step.phase === 'erro' && (
              <p role="alert" className="rounded-md border border-crit/40 bg-card p-3 text-sm text-crit">{step.message}</p>
            )}
          </div>

          <footer className="border-t border-border px-4 py-3">
            {blocked && (step.phase === 'pronto' || step.phase === 'erro') && <p className="mb-2 text-xs text-muted-foreground">{blocked}</p>}
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={finish} disabled={saving}>
                {step.phase === 'problema' ? 'Fechar' : 'Descartar'}
              </Button>
              {(step.phase === 'pronto' || step.phase === 'erro' || saving) && (
                <Button onClick={save} aria-disabled={!!blocked || saving} className={cn((blocked || saving) && 'pointer-events-none opacity-50')}>
                  {saving ? 'Salvando…' : step.phase === 'erro' ? 'Tentar de novo' : 'Salvar camada'}
                </Button>
              )}
            </div>
          </footer>
        </div>
      )}
    </>
  )
}
