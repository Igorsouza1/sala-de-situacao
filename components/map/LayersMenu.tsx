'use client'

import { useEffect, useState } from 'react'
import { DropdownMenu as Menu } from 'radix-ui'
import { Check, FolderPlus, MoreHorizontal, Pencil, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { menuContent, menuItem, menuSeparator } from '@/components/ui/menu-style'
import { controlItem } from './helpers/control-style'

// O menu "⋯" do painel de Camadas (DESIGN.md 13.1): o que vale para o painel todo, sem ocupar o cabeçalho com botões de texto.
// Editar camadas (só para quem pode), Atualizar e Nova pasta (só com mouse). O que o Atualizar está fazendo é dito no próprio ícone:
// ele gira enquanto busca e vira um check por uns segundos (8.4), com a frase para o leitor de tela.
//
// Exceção à regra 8 (todo ícone tem rótulo escrito): este é um ícone sem rótulo visível, por pedido explícito do responsável de
// produto. Compensa com `title` e `aria-label` ("Mais opções das camadas"), e cada item do menu tem rótulo escrito.

interface LayersMenuProps {
  canEdit: boolean
  onEdit: () => void
  refreshing: boolean
  onRefresh: () => void
  /** só no computador */
  canCreateFolder: boolean
  onNewFolder: () => void
}

export function LayersMenu({ canEdit, onEdit, refreshing, onRefresh, canCreateFolder, onNewFolder }: LayersMenuProps) {
  const [clicked, setClicked] = useState(false)
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!clicked || refreshing) return
    setClicked(false)
    setDone(true)
    const t = setTimeout(() => setDone(false), 2500)
    return () => clearTimeout(t)
  }, [clicked, refreshing])

  // os três ícones ocupam o mesmo lugar e trocam em crossfade: nada pula (8.4)
  const swap = (on: boolean) => cn('col-start-1 row-start-1 transition-[opacity,scale] duration-300 ease-out', on ? 'scale-100 opacity-100' : 'scale-75 opacity-0')
  const label = refreshing ? 'Atualizando…' : done ? 'Atualizado' : 'Mais opções das camadas'

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <button type="button" title="Mais opções" aria-label={label} className={cn('grid size-8 place-items-center', controlItem())}>
          <MoreHorizontal className={cn(swap(!refreshing && !done), 'size-4')} aria-hidden />
          <RefreshCw className={cn(swap(refreshing), 'size-4 animate-spin')} aria-hidden />
          <Check className={cn(swap(done && !refreshing), 'size-4 text-ok')} aria-hidden />
        </button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={6} className={menuContent}>
          {canEdit && (
            <Menu.Item onSelect={onEdit} className={menuItem}>
              <Pencil aria-hidden />
              Editar camadas
            </Menu.Item>
          )}
          <Menu.Item
            disabled={refreshing}
            onSelect={() => { setClicked(true); onRefresh() }}
            className={menuItem}
          >
            <RefreshCw aria-hidden />
            {refreshing ? 'Atualizando…' : 'Atualizar'}
          </Menu.Item>
          {canCreateFolder && (
            <>
              <Menu.Separator className={menuSeparator} />
              <Menu.Item onSelect={onNewFolder} className={menuItem}>
                <FolderPlus aria-hidden />
                Nova pasta
              </Menu.Item>
            </>
          )}
        </Menu.Content>
      </Menu.Portal>
      <span className="sr-only" role="status" aria-live="polite">{refreshing ? 'Atualizando…' : done ? 'Atualizado' : ''}</span>
    </Menu.Root>
  )
}
