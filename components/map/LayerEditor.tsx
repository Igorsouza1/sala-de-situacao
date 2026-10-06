'use client'

import { useMemo, useState, type KeyboardEvent } from 'react'
import { ArrowLeft, Check, ChevronDown, Plus } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapse } from '@/components/ui/collapse'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  FILL_LEVELS,
  LAYER_CATEGORIES,
  LINE_WEIGHTS,
  POINT_SIZES,
  mainColor,
  nearestLevel,
  withMainColor,
  type Level,
  type LayerCategory,
  type LayerEdit,
} from '@/lib/layer-style'
import { LAYER_ICONS, colorName, readPalette, toSixDigits } from './helpers/layer-palette'
import { controlItem } from './helpers/control-style'
import { Legend, type LayerManagerOption } from './LayerManager'
import { PanelCard } from './PanelCard'

// Editor de camada (DESIGN.md 13.3). Abre dentro do painel Camadas, com o mapa à vista: cada mudança aparece ao vivo no mapa
// antes de gravar. A TELA pensa pela pessoa (1 e 2.2): ela escolhe UMA cor, em palavras ("Fina", "Suave", "Pequeno"), e o
// editor traduz em números, deriva o contorno e esconde o que quase nunca muda. Nada de hex, de pixels ou de porcentagem.

const toPascal = (s: string) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())
const iconFor = (name: string) => ((LucideIcons as any)[toPascal(name)] as LucideIcons.LucideIcon | undefined) ?? LucideIcons.MapPin

const LEGEND_TYPE = { fill: 'polygon', line: 'line', circle: 'circle', icon: 'icon', other: 'heatmap' } as const

// A mesma amostra da lista, desenhada com o rascunho: a pessoa vê, no próprio painel, como a camada vai aparecer na legenda
function previewOption(edit: LayerEdit): LayerManagerOption {
  const s = edit.style
  return {
    id: 'preview',
    slug: 'preview',
    label: edit.name,
    color: s.color,
    fillColor: s.fillColor,
    fillOpacity: s.fillOpacity,
    icon: s.iconName,
    legendType: LEGEND_TYPE[s.shape],
  }
}

// setas movem a escolha, como em qualquer grupo de opções (e só a escolhida entra na ordem do Tab)
function arrowMove(e: KeyboardEvent, count: number, current: number, go: (next: number) => void) {
  const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
  if (!dir) return
  e.preventDefault()
  go((current + dir + count) % count)
}

function Segmented({ label, levels, value, onChange }: { label: string; levels: Level[]; value: number; onChange: (v: number) => void }) {
  const shown = nearestLevel(levels, value)
  const index = levels.indexOf(shown)
  return (
    <div>
      <span className="mb-2 block text-sm">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        onKeyDown={(e) => arrowMove(e, levels.length, index, (n) => { onChange(levels[n].value); (e.currentTarget.children[n] as HTMLElement)?.focus() })}
        className="flex gap-0.5 rounded-md border border-input bg-card p-0.5"
      >
        {levels.map((l) => {
          const selected = l === shown
          return (
            <button
              key={l.label}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => !selected && onChange(l.value)}
              className={cn('h-8 flex-1 px-2 text-xs font-medium', controlItem(selected))}
            >
              {l.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ColorField({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const palette = useMemo(readPalette, [])
  const current = value.toLowerCase()
  const index = palette.findIndex((p) => p.hex === current)
  const inPalette = index >= 0
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm">Cor</span>
        {/* o nome da cor, não o código: quem escolhe não precisa decifrar um hex (3.2) */}
        <span className="text-xs text-muted-foreground">{colorName(current)}</span>
      </div>
      <div
        role="radiogroup"
        aria-label="Cor"
        onKeyDown={(e) => inPalette && arrowMove(e, palette.length, index, (n) => { onChange(palette[n].hex); (e.currentTarget.children[n] as HTMLElement)?.focus() })}
        className="flex flex-wrap gap-2"
      >
        {palette.map((p, i) => {
          const selected = i === index
          return (
            <button
              key={p.name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={p.name}
              title={p.name}
              tabIndex={selected || (!inPalette && i === 0) ? 0 : -1}
              onClick={() => onChange(p.hex)}
              // o fio escuro por fora faz o Branco e as cores claras aparecerem no cartão branco (6.2)
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md ring-1 ring-foreground/25 transition-[scale,box-shadow] duration-200 ease-spring active:scale-95 focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/40',
                selected && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
              )}
              style={{ backgroundColor: p.hex }}
            >
              {selected && <Check className="h-4 w-4 text-background mix-blend-difference" aria-hidden />}
            </button>
          )
        })}
        {/* "Outra cor": o seletor do navegador, por baixo de um quadrado igual aos outros */}
        <label
          title="Outra cor"
          className={cn(
            'relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md ring-1 ring-foreground/25 transition-[scale,box-shadow] duration-200 ease-spring active:scale-95 focus-within:ring-[3px] focus-within:ring-ring/40',
            !inPalette && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
          )}
          style={!inPalette ? { backgroundColor: value } : undefined}
        >
          {inPalette ? <Plus className="h-4 w-4 text-muted-foreground" aria-hidden /> : <Check className="h-4 w-4 text-background mix-blend-difference" aria-hidden />}
          <input type="color" aria-label="Outra cor" value={toSixDigits(value)} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
        </label>
      </div>
    </div>
  )
}

interface LayerEditorProps {
  /** o nome da camada como está salvo (o título não muda enquanto a pessoa digita) */
  savedName: string
  edit: LayerEdit
  /** como estava ao abrir: serve para saber se algo mudou */
  initial: LayerEdit
  onChange: (edit: LayerEdit) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  error: string | null
  /** a camada tem o ícone vindo de regras por valor (ex.: Ações, por eixo): não dá para trocar por aqui */
  iconLocked: boolean
  /** a camada está desligada na lista: o mapa a mostra só enquanto a pessoa edita */
  hiddenOnMap: boolean
}

export function LayerEditor({ savedName, edit, initial, onChange, onSave, onCancel, saving, error, iconLocked, hiddenOnMap }: LayerEditorProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const shape = edit.style.shape
  const setStyle = (style: LayerEdit['style']) => onChange({ ...edit, style })
  const dirty = JSON.stringify(edit) !== JSON.stringify(initial)
  const nameOk = edit.name.trim().length > 0
  const canSave = dirty && nameOk && !saving
  // o botão bloqueado diz por quê (2.1)
  const why = !nameOk ? 'Dê um nome à camada.' : !dirty ? 'Nada mudou ainda.' : null
  const iconLabel = LAYER_ICONS.find((i) => i.name === edit.style.iconName)?.label

  return (
    <div className="space-y-4">
      {/* o rótulo escrito: seta sem texto não diz para onde volta (11) */}
      <button type="button" onClick={onCancel} className={cn('flex h-8 items-center gap-1.5 pl-1.5 pr-3 text-sm font-medium', controlItem())}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Camadas
      </button>

      <PanelCard title={`Editar ${savedName}`}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Legend option={previewOption(edit)} checked />
            <Input value={edit.name} maxLength={60} aria-label="Nome da camada" aria-invalid={!nameOk} onChange={(e) => onChange({ ...edit, name: e.target.value })} className="h-9" />
          </div>
          <p className="text-xs leading-snug text-muted-foreground">
            {hiddenOnMap ? 'Esta camada está desligada. Mostramos ela no mapa só enquanto você edita.' : 'É assim que ela aparece na lista e no mapa.'}
          </p>
        </div>
      </PanelCard>

      {shape !== 'other' ? (
        <PanelCard title="Aparência">
          <div className="space-y-5">
            <ColorField value={mainColor(edit.style)} onChange={(hex) => setStyle(withMainColor(edit.style, hex))} />

            {shape === 'fill' && (
              <>
                <Segmented label="Preenchimento" levels={FILL_LEVELS} value={edit.style.fillOpacity} onChange={(v) => setStyle({ ...edit.style, fillOpacity: v })} />
                <Segmented label="Linha do contorno" levels={LINE_WEIGHTS} value={edit.style.weight} onChange={(v) => setStyle({ ...edit.style, weight: v })} />
              </>
            )}
            {shape === 'line' && <Segmented label="Linha" levels={LINE_WEIGHTS} value={edit.style.weight} onChange={(v) => setStyle({ ...edit.style, weight: v })} />}
            {shape === 'circle' && <Segmented label="Tamanho" levels={POINT_SIZES} value={edit.style.radius} onChange={(v) => setStyle({ ...edit.style, radius: v })} />}

            {shape === 'icon' &&
              (iconLocked ? (
                <p className="text-xs leading-snug text-muted-foreground">O ícone desta camada vem do eixo de cada ação, então não dá para trocá-lo por aqui. Escolher o ícone de cada eixo ainda não existe.</p>
              ) : (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm">Ícone</span>
                    <span className="text-xs text-muted-foreground">{iconLabel ?? 'Outro'}</span>
                  </div>
                  <div role="radiogroup" aria-label="Ícone" className="grid grid-cols-6 gap-2">
                    {LAYER_ICONS.map((i) => {
                      const Icon = iconFor(i.name)
                      const selected = edit.style.iconName === i.name
                      return (
                        <button
                          key={i.name}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-label={i.label}
                          title={i.label}
                          onClick={() => setStyle({ ...edit.style, iconName: i.name })}
                          className={cn('flex h-9 items-center justify-center rounded-md border transition-[background-color,border-color,scale] duration-200 ease-spring active:scale-95 focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30', selected ? 'border-primary bg-secondary text-secondary-foreground' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground')}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        </PanelCard>
      ) : (
        <PanelCard title="Aparência">
          <p className="text-xs leading-snug text-muted-foreground">Este tipo de camada (mapa de calor) ainda não tem edição de aparência.</p>
        </PanelCard>
      )}

      {/* o que quase nunca muda fica recolhido: não é decisão que a pessoa precise tomar a cada edição (2.2) */}
      <section className="rounded-lg border border-border bg-card">
        <button
          type="button"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((v) => !v)}
          className="flex h-12 w-full items-center justify-between rounded-lg px-4 text-sm font-semibold transition-colors duration-200 hover:bg-muted focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
        >
          Mais opções
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-[320ms] ease-out', moreOpen && 'rotate-180')} aria-hidden />
        </button>
        <Collapse open={moreOpen}>
          <div className="space-y-4 px-4 pb-4 pt-1">
            <div>
              <span className="mb-1.5 block text-sm">Aparece em</span>
              <Select value={edit.category} onValueChange={(c) => onChange({ ...edit, category: c as LayerCategory })}>
                <SelectTrigger aria-label="Aparece em" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[1200]">
                  {LAYER_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="block text-sm">Já vem ligada</span>
                <span className="block text-xs text-muted-foreground">Quando alguém abre o mapa pela primeira vez.</span>
              </span>
              <Switch checked={edit.defaultVisibility} onCheckedChange={(v) => onChange({ ...edit, defaultVisibility: v })} aria-label="Já vem ligada" />
            </label>
          </div>
        </Collapse>
      </section>

      {/* a barra de salvar acompanha a rolagem: a frase de "vale para todos" e os botões nunca saem de vista */}
      <div className="sticky bottom-0 -mx-4 -mb-4 border-t border-border bg-card px-4 pb-4 pt-3">
        <p className="mb-2 text-xs text-muted-foreground">Vale para todos que veem esta região.</p>
        {error && <p role="alert" className="mb-2 text-xs text-crit">{error} O que você editou continua aqui.</p>}
        {why && !error && <p className="mb-2 text-xs text-muted-foreground">{why}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} aria-disabled={saving}>Cancelar</Button>
          <Button size="sm" aria-disabled={!canSave} onClick={() => canSave && onSave()}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
