'use client'

import { ArrowLeft } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlItem } from './helpers/control-style'
import { EditorFooter, IconGrid } from './LayerEditor'
import { PanelCard } from './PanelCard'

// Editor do ícone de UMA ÁREA de uma camada com grupos (DESIGN.md 13.3). Em Ações, por exemplo, a camada é só o interruptor que liga
// todas as ações: o que se edita de verdade é o ícone que cada área (cada eixo temático) tem no mapa. Por isso, no modo "Editar",
// a camada abre as suas áreas, e cada área abre este editor, que pergunta uma coisa só: qual ícone.

const toPascal = (s: string) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())

interface GroupIconEditorProps {
  layerName: string
  groupLabel: string
  /** o ícone da área agora (o escolhido, ou o que já valia) */
  icon: string
  /** a cor dos marcadores da camada, para a prévia ser igual ao mapa */
  color: string
  dirty: boolean
  onChange: (iconName: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  error: string | null
}

export function GroupIconEditor({ layerName, groupLabel, icon, color, dirty, onChange, onSave, onCancel, saving, error }: GroupIconEditorProps) {
  const Icon = ((LucideIcons as any)[toPascal(icon)] as LucideIcons.LucideIcon | undefined) ?? LucideIcons.MapPin
  return (
    <div className="space-y-4">
      <button type="button" onClick={onCancel} className={cn('flex h-8 items-center gap-1.5 pl-1.5 pr-3 text-sm font-medium', controlItem())}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Editar camadas
      </button>

      <PanelCard title={`Ícone de ${groupLabel}`} caption={`Área de ${layerName}. É o ícone que as ações desta área têm no mapa.`}>
        <div className="space-y-5">
          {/* a prévia é o marcador do mapa: círculo na cor da camada, ícone branco */}
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full ring-2 ring-background shadow-control transition-colors duration-200" style={{ backgroundColor: color }} aria-hidden>
              <Icon className="h-5 w-5 text-background" />
            </span>
            <p className="text-xs leading-snug text-muted-foreground">É assim que ela aparece no mapa.</p>
          </div>
          <IconGrid value={icon} onChange={onChange} />
        </div>
      </PanelCard>

      <EditorFooter saving={saving} error={error} why={dirty ? null : 'Nada mudou ainda.'} canSave={dirty && !saving} onSave={onSave} onCancel={onCancel} />
    </div>
  )
}
