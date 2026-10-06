'use client'

import { type LucideIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DockButton, useDock, type DockMotion } from './MapDock'
import { TOOL_LABELS, type Tool } from './helpers/tools'

// Grupo de ferramentas no dock (Medir, Consultar): o botão abre um menu para cima. Quando uma ferramenta do grupo está
// ativa, o botão acende e passa a dizer o nome dela (assim o dock mostra o estado atual sem a pessoa pensar).
// Escolher a que já está ativa desliga; escolher outra desliga a anterior (só uma por vez).

interface ToolMenuProps {
  icon: LucideIcon
  label: string
  motion?: DockMotion
  tools: { id: Tool; icon: LucideIcon }[]
  active: Tool | null
  onSelect: (tool: Tool | null) => void
}

export function ToolMenu({ icon, label, motion, tools, active, onSelect }: ToolMenuProps) {
  const { setOpen } = useDock()
  const current = tools.find((t) => t.id === active)

  return (
    // abrir o menu fecha o painel que estivesse aberto: dois pop-ups ao mesmo tempo disputam o mesmo lugar
    <DropdownMenu onOpenChange={(isOpen) => isOpen && setOpen(null)}>
      <DropdownMenuTrigger asChild>
        <DockButton icon={current?.icon ?? icon} label={current ? TOOL_LABELS[current.id] : label} motion={motion} active={!!current} />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="center" sideOffset={12} className="z-[1100] w-48">
        <DropdownMenuRadioGroup value={active ?? ''}>
          {tools.map((t) => (
            // onSelect (e não onValueChange): escolher a ativa de novo precisa disparar, para desligá-la
            <DropdownMenuRadioItem key={t.id} value={t.id} onSelect={() => onSelect(t.id === active ? null : t.id)}>
              <t.icon className="mr-2 h-4 w-4" aria-hidden />
              {TOOL_LABELS[t.id]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
