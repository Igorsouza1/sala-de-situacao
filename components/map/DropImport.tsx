'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FileUp, Palette, TriangleAlert, UploadCloud, X } from 'lucide-react'
import type { FeatureCollection } from 'geojson'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFileDrop } from '@/hooks/useFileDrop'
import { cn } from '@/lib/utils'
import { colorFromFile, kindOfFile, nameFromFile } from '@/lib/geo-import/files'
import { MAX_MB, problemMessage, readGeoJson, type GeoJsonSummary } from '@/lib/geo-import/geojson'
import { RasterProblemError, convertRaster, inspectRaster, rasterProblemMessage, type RasterConversion, type RasterInfo } from '@/lib/geo-import/raster'
import { SaveLayerError, saveGeoJsonLayer, saveRasterLayer } from '@/lib/geo-import/upload'
import { controlItem, controlSurface } from './helpers/control-style'
import { ColorField } from './LayerEditor'
import { PanelCard } from './PanelCard'
import type { NoticeData } from './Notice'
import type { RasterSpec } from './RasterLayers'

// Soltar um arquivo no mapa (DESIGN.md 2.1 e 13): a pessoa arrasta, o mapa mostra o que veio ANTES de gravar, e só então ela salva.
// Estados desenhados: lendo (esqueleto), preparando (raster: barra de andamento), pronto (prévia no mapa), salvando (barra),
// erro (o que ela preencheu fica) e arquivo que não serve (diz o que fazer). A tela pensa pela pessoa: nome e cor já vêm
// sugeridos pelo nome do arquivo e o campo de ano é achado sozinho. Vários arquivos soltos de uma vez viram uma fila, um cartão por vez.

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
}

type Item =
  | { kind: 'vetor'; collection: FeatureCollection; summary: GeoJsonSummary }
  | { kind: 'raster'; conversion: RasterConversion }

type Step =
  | { phase: 'lendo' }
  | { phase: 'preparando'; info: RasterInfo; fraction: number }
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
  return item.kind === 'vetor' ? item.summary.bounds : item.conversion.bounds
}

export function DropImport({ regiaoId, canEdit, mapRef, onPreview, onSaved, onNotice }: DropImportProps) {
  const [queue, setQueue] = useState<File[]>([])
  const [step, setStep] = useState<Step>({ phase: 'lendo' })
  const [name, setName] = useState('')
  const [color, setColor] = useState(() => colorFromFile(''))
  const [entered, setEntered] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const file = queue[0] as File | undefined
  const hasFile = !!file
  // quem chama pode passar uma função nova a cada render: a limpeza da prévia não pode depender da identidade dela
  const previewRef = useRef(onPreview)
  previewRef.current = onPreview

  const dragging = useFileDrop((files) => setQueue((q) => [...q, ...files]))

  // chega a vez de um arquivo: lê, confere e mostra a prévia (nada é gravado ainda)
  useEffect(() => {
    if (!file) return
    let alive = true
    setStep({ phase: 'lendo' })
    setName(nameFromFile(file.name))
    setColor(colorFromFile(file.name))
    setLeaving(false)

    const kind = kindOfFile(file.name)
    if (kind === 'desconhecido') {
      setStep({ phase: 'problema', message: `“${file.name}” não é um formato que o mapa lê. Use GeoJSON (.geojson) ou raster (.tif).` })
      return
    }

    if (kind === 'raster') {
      ;(async () => {
        try {
          const info = await inspectRaster(file)
          if (!alive) return
          setStep({ phase: 'preparando', info, fraction: 0 })
          const conversion = await convertRaster(file, info, (fraction) => alive && setStep({ phase: 'preparando', info, fraction }))
          if (alive) setStep({ phase: 'pronto', item: { kind: 'raster', conversion } })
        } catch (e) {
          if (!alive) return
          setStep({ phase: 'problema', message: e instanceof RasterProblemError ? e.message : rasterProblemMessage({ code: 'ilegivel' }) })
        }
      })()
      return () => { alive = false }
    }

    if (file.size > MAX_MB * 1024 * 1024) {
      setStep({ phase: 'problema', message: problemMessage({ code: 'grande-demais', mb: Math.round(file.size / 1024 / 1024) }) })
      return
    }
    file.text().then(
      (text) => {
        if (!alive) return
        const reading = readGeoJson(text)
        setStep(reading.ok ? { phase: 'pronto', item: { kind: 'vetor', collection: reading.collection, summary: reading.summary } } : { phase: 'problema', message: problemMessage(reading.problem) })
      },
      () => alive && setStep({ phase: 'problema', message: problemMessage({ code: 'json-invalido' }) }),
    )
    return () => { alive = false }
  }, [file])

  // o cartão cresce ao entrar (8.1): um quadro depois de montado
  useEffect(() => {
    if (!hasFile) { setEntered(false); return }
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [hasFile])

  // a prévia no mapa acompanha o que a pessoa vê no cartão (inclusive a cor, ao vivo)
  const item = step.phase === 'pronto' || step.phase === 'salvando' || step.phase === 'erro' ? step.item : null
  useEffect(() => {
    if (!item) { previewRef.current(null); return }
    if (item.kind === 'vetor') { previewRef.current({ kind: 'vetor', data: item.collection, color }); return }
    const c = item.conversion
    previewRef.current({
      kind: 'raster',
      spec: { key: 'preview', source: c.png, bounds: c.bounds, width: c.width, height: c.height, mode: c.mode, max: c.max, color, firstYear: c.firstYear },
    })
  }, [item, color])
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
            GeoJSON ou raster (.tif). Pode soltar vários de uma vez.
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
              <PanelCard title="Lendo o arquivo…" caption={file.name} icon={FileUp}>
                <div className="space-y-2" aria-hidden>
                  <div className="h-4 w-3/4 rounded-sm bg-shimmer" />
                  <div className="h-4 w-1/2 rounded-sm bg-shimmer" />
                </div>
              </PanelCard>
            )}

            {step.phase === 'preparando' && (
              <PanelCard title="Preparando o raster…" caption={file.name} icon={FileUp}>
                <div role="status" aria-live="polite">
                  <p className="mb-2 text-sm">
                    {step.info.mode === 'bandas' ? `Lendo ${step.info.bands} anos de dados.` : 'Lendo os valores.'} Pode levar alguns segundos.
                  </p>
                  <div className="h-2 overflow-hidden rounded-full bg-border" aria-hidden>
                    <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${Math.round(step.fraction * 100)}%` }} />
                  </div>
                </div>
              </PanelCard>
            )}

            {step.phase === 'problema' && (
              <PanelCard title="Este arquivo não entrou" caption={file.name} icon={TriangleAlert}>
                <p role="alert" className="text-sm">{step.message}</p>
              </PanelCard>
            )}

            {item && (
              <>
                <PanelCard title="O que encontramos" caption={queue.length > 1 ? `${file.name} · arquivo 1 de ${queue.length}` : file.name} icon={FileUp}>
                  {item.kind === 'vetor' ? (
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

                <PanelCard title="Como vai aparecer" caption="A prévia já está no mapa." icon={Palette}>
                  <div className="space-y-5">
                    <label className="block">
                      <span className="mb-2 block text-sm">Nome</span>
                      <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} disabled={saving} />
                    </label>
                    <fieldset disabled={saving} className="min-w-0 border-0 p-0">
                      <ColorField value={color} onChange={setColor} />
                    </fieldset>
                  </div>
                </PanelCard>
              </>
            )}

            {step.phase === 'salvando' && (
              <div role="status" aria-live="polite">
                <p className="mb-2 text-sm">
                  {step.item.kind === 'vetor' ? `Salvando… ${step.done.toLocaleString('pt-BR')} de ${step.total.toLocaleString('pt-BR')}` : 'Salvando o raster…'}
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-border" aria-hidden>
                  <div
                    className={cn('h-full rounded-full bg-primary transition-[width] duration-300 ease-out', step.item.kind === 'raster' && 'w-full bg-shimmer')}
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
