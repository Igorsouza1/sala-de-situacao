'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Source, useMap, type SourceProps } from 'react-map-gl/maplibre'
import { classLut, hexToRgb, paintClasses, paintRaster, type Bounds } from '@/lib/geo-import/raster-paint'
import type { RasterMode } from '@/lib/geo-import/raster-pack'
import { decodeSeries } from '@/lib/geo-import/class-series-read'
import type { SeriesFrames } from '@/lib/geo-import/class-series'
import { classInfo } from '@/lib/geo-import/mapbiomas'

// Camadas raster no mapa (importadas por arrastar e soltar). Cada uma é uma imagem empacotada (um bit por ano, ver
// lib/geo-import/raster-pack.ts) que aqui é PINTADA com o período pedido numa tela (canvas) e entregue ao MapLibre.
// Mudar o período repinta só essa tela: não baixa nada de novo.
// Uma série de classes (uso do solo, um mapa por ano) chega codificada (ver class-series.ts) e é aberta uma vez; trocar o ano
// aplica só as mudanças daquele ano e repinta com as cores da legenda.

export interface RasterSpec {
  /** o slug da camada, ou "preview" para o que ainda não foi salvo */
  key: string
  /** a imagem empacotada ou a série codificada: um endereço (camada salva) ou o arquivo (prévia) */
  source: string | Blob
  bounds: Bounds
  width: number
  height: number
  mode: RasterMode | 'classes'
  /** modo "classes": os anos da série, em ordem (o ano mostrado é o fim de `years`) */
  seriesYears?: number[]
  /** maior valor (modo "valores") */
  max: number
  /** a cor da camada */
  color: string
  /** a transparência que a pessoa escolheu para a camada (e para a pasta dela); ausente: cheia */
  opacity?: number
  firstYear: number | null
  /** o período mostrado, em anos (modo "bandas") */
  years?: [number, number]
}

const PREVIEW_KEY = 'preview'

type Loaded =
  | { kind: 'packed'; src: Uint32Array; width: number; height: number }
  | { kind: 'classes'; frames: SeriesFrames; width: number; height: number }

const fetchBlob = (source: string | Blob, signal: AbortSignal) =>
  typeof source === 'string' ? fetch(source, { signal }).then((r) => (r.ok ? r.blob() : Promise.reject(new Error('raster')))) : Promise.resolve(source)

async function load(spec: RasterSpec, signal: AbortSignal): Promise<Loaded> {
  const blob = await fetchBlob(spec.source, signal)
  if (spec.mode === 'classes') {
    const frames = await decodeSeries(blob, spec.width * spec.height, spec.seriesYears?.length ?? 1)
    return { kind: 'classes', frames, width: spec.width, height: spec.height }
  }
  // sem conversão de cor: queremos os bytes exatamente como foram empacotados
  const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('canvas')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  return { kind: 'packed', src: new Uint32Array(data.buffer, data.byteOffset, data.byteLength / 4), width: canvas.width, height: canvas.height }
}

/** as cores da legenda, montadas uma vez (o MapBiomas tem as mesmas cores em todas as séries) */
let LUT: Uint32Array | null = null
const lut = () => (LUT ??= classLut((c) => classInfo(c).color))

function RasterLayer({ spec, beforeSlugs }: { spec: RasterSpec; beforeSlugs: string[] }) {
  const { current: mapa } = useMap()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const canvas = useMemo(() => document.createElement('canvas'), [])
  const dest = useRef<Uint32Array | null>(null)

  useEffect(() => {
    const abort = new AbortController()
    setLoaded(null)
    load(spec, abort.signal).then(setLoaded, () => { /* sem imagem: a camada não aparece, o resto do mapa segue */ })
    return () => abort.abort()
    // o dado só muda quando muda a fonte (o tamanho e os anos vêm junto dela)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.source])

  const from = spec.years && spec.firstYear !== null ? spec.years[0] - spec.firstYear : 0
  const to = spec.years && spec.firstYear !== null ? spec.years[1] - spec.firstYear : 23
  // série de classes: o índice do ano mostrado (o último, se nenhum foi escolhido)
  const frameIndex = spec.seriesYears ? Math.max(0, spec.years ? spec.seriesYears.indexOf(spec.years[1]) : spec.seriesYears.length - 1) : 0

  // repinta quando muda o período ou a cor (com uma folga curta, para o controle de anos não repintar a cada pixel arrastado)
  const [painted, setPainted] = useState(0)
  useEffect(() => {
    if (!loaded) return
    const t = setTimeout(() => {
      const { width, height } = loaded
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        dest.current = new Uint32Array(width * height)
      }
      const out = (dest.current ??= new Uint32Array(width * height))
      if (loaded.kind === 'classes') paintClasses(loaded.frames.frame(frameIndex), out, width, height, spec.bounds, lut())
      else paintRaster(loaded.src, out, width, height, spec.bounds, { mode: spec.mode as RasterMode, rgb: hexToRgb(spec.color), from, to, max: spec.max })
      canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(out.buffer, out.byteOffset, out.byteLength), width, height), 0, 0)
      setPainted((n) => n + 1)
    }, painted === 0 ? 0 : 40)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, spec.color, spec.mode, spec.max, from, to, frameIndex, spec.bounds])

  // o MapLibre só copia a tela para a imagem enquanto a fonte está "tocando": toca por um quadro depois de cada repintura
  const sourceId = `raster-${spec.key}`
  useEffect(() => {
    const map = mapa?.getMap()
    const source = map?.getSource(sourceId) as { play?: () => void; pause?: () => void } | undefined
    if (!map || !source?.play || painted < 2) return
    source.play()
    map.triggerRepaint()
    map.once('render', () => source.pause?.())
  }, [painted, mapa, sourceId])

  if (!loaded || painted === 0) return null
  const [w, s, e, n] = spec.bounds
  // A camada salva ocupa o lugar que a pessoa deu a ela na lista de camadas (useLayerStack). Só a prévia, que ainda não está na lista,
  // fica abaixo das áreas, linhas e pontos da Prisma: ela é o "fundo" do que a pessoa está conferindo.
  const before =
    spec.key === PREVIEW_KEY
      ? mapa?.getMap().getStyle()?.layers?.find((l) => beforeSlugs.some((slug) => l.id === `${slug}-fill` || l.id === `${slug}-line` || l.id === `${slug}-circle`))?.id
      : undefined

  return (
    // react-map-gl não tipa a fonte "canvas" (o MapLibre a tem); ela recebe as props como estão
    <Source {...({ id: sourceId, type: 'canvas', canvas, coordinates: [[w, n], [e, n], [e, s], [w, s]], animate: false } as unknown as SourceProps)}>
      <Layer id={`${sourceId}-layer`} type="raster" beforeId={before} paint={{ 'raster-opacity': 0.9 * (spec.opacity ?? 1), 'raster-resampling': 'nearest', 'raster-fade-duration': 0 }} />
    </Source>
  )
}

export function RasterLayers({ specs, vectorSlugs }: { specs: RasterSpec[]; vectorSlugs: string[] }) {
  return (
    <>
      {specs.map((spec) => (
        <RasterLayer key={spec.key} spec={spec} beforeSlugs={vectorSlugs} />
      ))}
    </>
  )
}
