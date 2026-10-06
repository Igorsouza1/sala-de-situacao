'use client'

import { useMemo } from 'react'
import { ArrowLeft, Check, Plus } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { LAYER_CATEGORIES, editableFields, type LayerCategory, type LayerEdit, type LayerShape } from '@/lib/layer-style'
import { LAYER_ICONS, readPalette, toSixDigits } from './helpers/layer-palette'
import { controlItem } from './helpers/control-style'
import { PanelCard } from './PanelCard'

// Editor de camada (DESIGN.md 13.3). Abre dentro do painel Camadas, com o mapa à vista: cada mudança aparece ao vivo no mapa
// antes de gravar. A mudança vale para todos que veem a região, e a frase disso fica sempre à vista, junto do botão Salvar.
// Só aparecem os controles que fazem sentido para o tipo da camada (um ponto não tem "cobertura do preenchimento").

const toPascal = (s: string) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())
const iconFor = (name: string) => ((LucideIcons as any)[toPascal(name)] as LucideIcons.LucideIcon | undefined) ?? LucideIcons.MapPin

const STROKE_LABEL: Record<LayerShape, string> = { fill: 'Contorno', line: 'Cor da linha', circle: 'Borda', icon: 'Cor do ícone', other: 'Cor' }
const WEIGHT_LABEL: Record<LayerShape, string> = { fill: 'Espessura do contorno', line: 'Espessura da linha', circle: 'Espessura da borda', icon: '', other: '' }

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const palette = useMemo(readPalette, [])
  const inPalette = palette.some((p) => p.hex === value.toLowerCase())
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{value.toLowerCase()}</span>
      </div>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {palette.map((p) => {
          const selected = p.hex === value.toLowerCase()
          return (
            <button
              key={p.name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={p.name}
              title={p.name}
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
        {/* "Outra cor…": o seletor do navegador, por baixo de um quadrado igual aos outros */}
        <label
          title="Outra cor"
          className={cn(
            'relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md ring-1 ring-foreground/25 transition-[scale,box-shadow] duration-200 ease-spring active:scale-95 focus-within:ring-[3px] focus-within:ring-ring/40',
            !inPalette && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
          )}
          style={!inPalette ? { backgroundColor: value } : undefined}
        >
          {inPalette ? <Plus className="h-4 w-4 text-muted-foreground" aria-hidden /> : <Check className="h-4 w-4 text-background mix-blend-difference" aria-hidden />}
          <input
            type="color"
            aria-label={`${label}: outra cor`}
            value={toSixDigits(value)}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  )
}

function SliderField({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm">{label}</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{format(value)}</span>
      </div>
      <Slider aria-label={label} min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  )
}

interface LayerEditorProps {
  /** o nome da camada como está salvo (o título do editor não muda enquanto a pessoa digita) */
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
}

export function LayerEditor({ savedName, edit, initial, onChange, onSave, onCancel, saving, error, iconLocked }: LayerEditorProps) {
  const fields = editableFields(edit.style.shape)
  const shape = edit.style.shape
  const setStyle = (patch: Partial<LayerEdit['style']>) => onChange({ ...edit, style: { ...edit.style, ...patch } })
  const dirty = JSON.stringify(edit) !== JSON.stringify(initial)
  const nameOk = edit.name.trim().length > 0
  const canSave = dirty && nameOk && !saving
  // o botão bloqueado diz por quê (2.1)
  const why = !nameOk ? 'Dê um nome à camada.' : !dirty ? 'Nada mudou ainda.' : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onCancel} aria-label="Voltar às camadas, descartando o que mudou" className={cn('flex h-8 w-8 shrink-0 items-center justify-center', controlItem())}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
        <h4 className="min-w-0 truncate text-sm font-semibold">Editar {savedName}</h4>
      </div>

      <PanelCard title="Geral">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm">Nome</span>
            <Input value={edit.name} maxLength={60} aria-invalid={!nameOk} onChange={(e) => onChange({ ...edit, name: e.target.value })} className="h-9" />
          </label>

          <div>
            <span className="mb-1.5 block text-sm">Seção da lista</span>
            <Select value={edit.category} onValueChange={(c) => onChange({ ...edit, category: c as LayerCategory })}>
              <SelectTrigger aria-label="Seção da lista" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[1200]">
                {LAYER_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span>
              <span className="block text-sm">Abre ligada</span>
              <span className="block text-xs text-muted-foreground">Liga sozinha quando alguém abre o mapa pela primeira vez.</span>
            </span>
            <Switch checked={edit.defaultVisibility} onCheckedChange={(v) => onChange({ ...edit, defaultVisibility: v })} aria-label="Abre ligada" />
          </label>
        </div>
      </PanelCard>

      {shape !== 'other' ? (
        <PanelCard title="Aparência" caption="Você vê a mudança no mapa antes de salvar.">
          <div className="space-y-5">
            {fields.stroke && <ColorField label={STROKE_LABEL[shape]} value={edit.style.color} onChange={(color) => setStyle({ color })} />}
            {fields.fill && <ColorField label={shape === 'circle' ? 'Miolo do ponto' : 'Preenchimento'} value={edit.style.fillColor} onChange={(fillColor) => setStyle({ fillColor })} />}
            {fields.fillOpacity && (
              <SliderField label="Cobertura do preenchimento" value={Math.round(edit.style.fillOpacity * 100)} min={0} max={100} step={5} format={(v) => (v === 0 ? 'só o contorno' : `${v}%`)} onChange={(v) => setStyle({ fillOpacity: v / 100 })} />
            )}
            {fields.weight && <SliderField label={WEIGHT_LABEL[shape]} value={edit.style.weight} min={0} max={10} step={0.5} format={(v) => (v === 0 ? 'sem' : `${v} px`)} onChange={(weight) => setStyle({ weight })} />}
            {fields.radius && <SliderField label="Tamanho do ponto" value={edit.style.radius} min={2} max={20} step={1} format={(v) => `${v} px`} onChange={(radius) => setStyle({ radius })} />}
            {fields.icon && (
              iconLocked ? (
                <p className="text-xs leading-snug text-muted-foreground">O ícone desta camada vem do eixo temático de cada ação, então não dá para trocá-lo por aqui. Escolher o ícone de cada eixo ainda não existe.</p>
              ) : (
                <div>
                  <span className="mb-2 block text-sm">Ícone</span>
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
                          onClick={() => setStyle({ iconName: i.name })}
                          className={cn('flex h-9 items-center justify-center rounded-md border transition-[background-color,border-color,scale] duration-200 ease-spring active:scale-95 focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30', selected ? 'border-primary bg-secondary text-secondary-foreground' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground')}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </PanelCard>
      ) : (
        <PanelCard title="Aparência">
          <p className="text-xs leading-snug text-muted-foreground">Este tipo de camada (mapa de calor) ainda não tem edição de aparência.</p>
        </PanelCard>
      )}

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
