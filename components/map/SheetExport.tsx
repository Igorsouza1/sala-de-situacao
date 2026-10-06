'use client'

import { useEffect, useRef } from 'react'
import { SheetPage, type Camera, type SheetPageProps } from './SheetPage'
import { captureSheet, exportSize, type ExportKind } from './helpers/export-sheet'
import { sheetLayout } from './helpers/sheet'

// A folha de exportação (Gerar mapa): a mesma folha da tela, desenhada fora da tela no tamanho real do papel e com o mapa a 300 dpi.
// Espera o mapa terminar de carregar (tiles, ícones e imagens), fotografa e entrega o arquivo. Só existe enquanto o arquivo é gerado.

export interface ExportJob {
  kind: ExportKind
  /** tudo o que a folha mostra, igual à da tela; o enquadramento vem em `camera` */
  page: Omit<SheetPageProps, 'px' | 'interactive' | 'pixelRatio' | 'initialCamera' | 'onSettle' | 'onIdle' | 'cameraProbe'>
  /** onde o mapa está na tela agora, já convertido para o tamanho da folha de exportação */
  camera: Camera
}

const MAX_WAIT_MS = 60_000 // sem internet ou com tiles que não chegam, o mapa nunca fica quieto: melhor avisar do que esperar para sempre
const SETTLE_MS = 600 // depois de quieto, a grade, a escala e as imagens ainda precisam desenhar

export function SheetExport({ job, onDone, onError }: { job: ExportJob; onDone: (blob: Blob) => void; onError: (reason: unknown) => void }) {
  const { paper, orientation } = job.page.settings
  const sheet = sheetLayout(paper, orientation)
  const size = exportSize(sheet.width, sheet.height)
  const node = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    const timer = setTimeout(() => {
      if (alive.current && !started.current) { started.current = true; onError(new Error('tempo esgotado')) }
    }, MAX_WAIT_MS)
    return () => { alive.current = false; clearTimeout(timer) }
    // o trabalho é um só: o efeito roda uma vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const capture = async () => {
    try {
      await new Promise((r) => setTimeout(r, SETTLE_MS))
      const el = node.current
      if (!el || !alive.current) return
      await Promise.all(Array.from(el.querySelectorAll('img')).map((img) => img.decode().catch(() => undefined)))
      await document.fonts?.ready
      const blob = await captureSheet(el, sheet.width, sheet.height, job.kind)
      if (alive.current) onDone(blob)
    } catch (e) {
      if (alive.current) onError(e)
    }
  }

  return (
    <div aria-hidden inert style={{ position: 'fixed', left: -100000, top: 0, width: size.cssW, height: size.cssH, pointerEvents: 'none' }}>
      <SheetPage
        ref={node}
        {...job.page}
        px={size.pxPerMm}
        interactive={false}
        pixelRatio={size.pixelRatio}
        initialCamera={job.camera}
        onIdle={() => {
          if (started.current) return
          started.current = true
          void capture()
        }}
      />
    </div>
  )
}
