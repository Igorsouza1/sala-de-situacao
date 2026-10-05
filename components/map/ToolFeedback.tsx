'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Check, Copy, Crosshair, Info, Ruler, SquareDashed, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlItem, controlSurface } from './helpers/control-style'
import { TOOL_LABELS, formatArea, formatCoordinate, formatDistance, type Tool } from './helpers/tools'
import { PropertyInfoCard } from './PropertyInfoCard'

// Faixa de modo (DESIGN.md 13): fica acima do dock enquanto uma ferramenta está ativa. Diz o que o clique faz agora,
// mostra o resultado (distância, área, coordenada) e leva a saída. O cartão da propriedade abre logo acima dela.
// O anúncio para leitor de tela é só a ferramenta ativa: o número muda a cada movimento do mouse e leria sem parar.

const ICONS: Record<Tool, LucideIcon> = {
  'measure-distance': Ruler,
  'measure-area': SquareDashed,
  coords: Crosshair,
  property: Info,
}

interface ToolFeedbackProps {
  tool: Tool
  onExit: () => void
  measure: { points: number; drawing: boolean; distance: number; area: number; onClear: () => void; onFinish: () => void }
  coordinate: { lat: number; lng: number } | null
  property: { id: number | null; basic: React.ComponentProps<typeof PropertyInfoCard>['hoveredPropertyBasic'] }
}

function BarButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex h-8 items-center gap-1.5 px-2.5 text-sm font-medium', controlItem())}>
      {children}
    </button>
  )
}

export function ToolFeedback({ tool, onExit, measure, coordinate, property }: ToolFeedbackProps) {
  const Icon = ICONS[tool]
  const [copied, setCopied] = useState(false)
  useEffect(() => { setCopied(false) }, [coordinate])

  const copy = () => {
    if (!coordinate) return
    navigator.clipboard.writeText(formatCoordinate(coordinate.lat, coordinate.lng)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  let message: ReactNode
  if (tool === 'measure-distance') {
    message = measure.points === 0
      ? 'Clique no mapa para marcar o primeiro ponto.'
      : <>Distância: <strong className="font-mono font-semibold tabular-nums">{formatDistance(measure.distance)}</strong></>
  } else if (tool === 'measure-area') {
    message = measure.points < 3
      ? 'Clique no mapa para marcar os cantos da área.'
      : <>Área: <strong className="font-mono font-semibold tabular-nums">{formatArea(measure.area)}</strong></>
  } else if (tool === 'coords') {
    message = coordinate
      ? <strong className="font-mono font-semibold tabular-nums">{formatCoordinate(coordinate.lat, coordinate.lng)}</strong>
      : 'Clique no mapa para ver as coordenadas.'
  } else {
    message = 'Passe o mouse sobre uma propriedade, ou toque nela.'
  }

  const measuring = tool === 'measure-distance' || tool === 'measure-area'

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {tool === 'property' && <PropertyInfoCard hoveredPropertyId={property.id} hoveredPropertyBasic={property.basic} />}

      <div className={cn('flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md py-1.5 pl-3 pr-1.5 text-sm', controlSurface)}>
        <p className="sr-only" role="status">Ferramenta ativa: {TOOL_LABELS[tool]}.</p>
        <span className="flex items-center gap-2" aria-hidden={false}>
          <Icon className="h-4 w-4 shrink-0 text-mineral" aria-hidden />
          <span>{message}</span>
        </span>

        <span className="ml-auto flex items-center gap-0.5">
          {measuring && measure.drawing && measure.points >= 2 && <BarButton onClick={measure.onFinish}>Concluir</BarButton>}
          {measuring && measure.points > 0 && <BarButton onClick={measure.onClear}>Limpar</BarButton>}
          {tool === 'coords' && coordinate && (
            <BarButton onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5 text-ok" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
              {copied ? 'Copiado' : 'Copiar'}
            </BarButton>
          )}
          <BarButton onClick={onExit}>
            <X className="h-3.5 w-3.5" aria-hidden />
            Sair
            <kbd className="rounded-sm border border-border px-1 font-mono text-[10px] text-muted-foreground [@media(pointer:coarse)]:hidden">Esc</kbd>
          </BarButton>
        </span>
      </div>
    </div>
  )
}
