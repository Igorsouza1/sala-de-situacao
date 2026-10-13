'use client'

import { useEffect, useRef, useState } from 'react'

// Arrastar arquivos do computador para a janela. Diz se há arquivos sobre a janela (para o aviso "Solte aqui") e entrega os
// arquivos soltos. Ignora o que não é arquivo (texto, imagem arrastada da página) e as áreas que têm o próprio "soltar"
// (diálogos, ou qualquer coisa marcada com data-no-map-drop): lá o arquivo vai para quem o espera.

const hasFiles = (e: DragEvent) => !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')
const ownsDrop = (e: DragEvent) => e.target instanceof Element && !!e.target.closest('[role="dialog"][aria-modal="true"], [data-no-map-drop]')

export function useFileDrop(onFiles: (files: File[]) => void, enabled = true): boolean {
  const [over, setOver] = useState(false)
  const handler = useRef(onFiles)
  handler.current = onFiles

  useEffect(() => {
    if (!enabled) return
    // dragenter/dragleave disparam para cada elemento por onde o arquivo passa: o contador diz quando ele realmente saiu da janela
    let depth = 0
    const enter = (e: DragEvent) => {
      if (!hasFiles(e) || ownsDrop(e)) return
      depth++
      setOver(true)
    }
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setOver(false)
    }
    const overEv = (e: DragEvent) => {
      if (!hasFiles(e) || ownsDrop(e)) return
      e.preventDefault() // sem isto o navegador abre o arquivo em vez de entregá-lo
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }
    const drop = (e: DragEvent) => {
      depth = 0
      setOver(false)
      if (!hasFiles(e) || ownsDrop(e)) return
      e.preventDefault()
      const files = Array.from(e.dataTransfer?.files ?? [])
      if (files.length) handler.current(files)
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', overEv)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', overEv)
      window.removeEventListener('drop', drop)
      setOver(false)
    }
  }, [enabled])

  return over
}
