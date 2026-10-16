'use client'

import type { ReactNode } from 'react'
import { Folder } from 'lucide-react'
import { Collapse } from '@/components/ui/collapse'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { MIN_OPACITY } from './helpers/layer-layout'
import { ColorField } from './LayerEditor'
import { Legend, type LayerManagerOption } from './LayerManager'

// O cartão que abre ao clicar na amostra de uma camada (ou em "Cor e transparência" no botão direito) — DESIGN.md 13.1.
// Ajusta como a PESSOA vê a camada, só para ela: o catálogo não muda (isso é o Editar, de quem cuida do território).
// A transparência não mostra número: a amostra do alto fica mais clara na hora, e o mapa também (2.2).

interface Common {
  /** o nome da camada ou da pasta */
  title: string
  /** a transparência de agora, de 0.05 a 1 (cheia) */
  opacity: number
  onOpacity: (opacity: number) => void
  /** a pessoa mexeu em algo aqui; só então o "voltar ao original" aparece */
  changed: boolean
  onReset: () => void
}

export interface LayerCardProps extends Common {
  kind: 'layer'
  /** a camada, já com o que a pessoa escolheu: a amostra do alto é o que o mapa desenha */
  option: LayerManagerOption
  /** cor: a de agora; ausente quando esta camada não deixa trocar a cor (a cor diz algo) */
  color?: { value: string; onChange: (hex: string) => void }
  /** por que a cor não muda (frase) */
  colorLockedReason?: string
}

export interface FolderCardProps extends Common {
  kind: 'folder'
  count: number
}

const words = (opacity: number) => (opacity >= 0.95 ? 'Normal' : opacity >= 0.55 ? 'Um pouco mais leve' : 'Bem leve')

export function LayerStyleCard(props: LayerCardProps | FolderCardProps): ReactNode {
  const { title, opacity, onOpacity, changed, onReset } = props
  const caption =
    props.kind === 'folder'
      ? `Vale para as ${props.count === 1 ? 'camada' : 'camadas'} da pasta, junto com a de cada uma. Só para você.`
      : 'Só para você. O mapa dos outros não muda.'
  return (
    <div>
      <div className="flex items-center gap-3">
        {props.kind === 'layer' ? (
          <Legend option={props.option} checked />
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
            <Folder className="h-5 w-5 text-muted-foreground" />
          </span>
        )}
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold">{title}</h4>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{caption}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span id="card-opacity" className="text-sm">Transparência</span>
          <span className="text-xs text-muted-foreground" aria-live="polite">{words(opacity)}</span>
        </div>
        <Slider
          aria-labelledby="card-opacity"
          min={Math.round(MIN_OPACITY * 100)}
          max={100}
          step={5}
          value={[Math.round(opacity * 100)]}
          onValueChange={([v]) => onOpacity(Math.min(1, Math.max(MIN_OPACITY, v / 100)))}
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground" aria-hidden>
          <span>Mais transparente</span>
          <span>Normal</span>
        </div>
      </div>

      {props.kind === 'layer' && (
        <div className="mt-5">
          {props.color ? (
            <ColorField value={props.color.value} onChange={props.color.onChange} />
          ) : (
            // bloqueado com o motivo ao lado (2.1): sem isso a ausência da cor pareceria um defeito
            props.colorLockedReason && <p className="text-xs leading-snug text-muted-foreground">{props.colorLockedReason}</p>
          )}
        </div>
      )}

      {/* o "voltar" só existe quando há o que voltar; quem aparece cresce, quem some encolhe (8.4) */}
      <Collapse open={changed}>
        <div className="pt-5">
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={onReset}>
            Voltar ao original
          </Button>
        </div>
      </Collapse>
    </div>
  )
}
