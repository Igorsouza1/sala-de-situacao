'use client'

import { LayoutTemplate } from 'lucide-react'
import { DockButton } from './MapDock'

// O botão do dock que abre o Gerar mapa. O rótulo é escrito (11): "Gerar mapa" diz o que acontece; "Imprimir" era só um dos destinos.
export function GerarMapaButton({ onOpen }: { onOpen: () => void }) {
  return <DockButton icon={LayoutTemplate} label="Gerar mapa" motion="grow" onClick={onOpen} />
}
