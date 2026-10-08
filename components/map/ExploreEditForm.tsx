'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ACAO_CATEGORIAS, ACAO_STATUS } from '@/lib/validations/map-consulta-edit'
import type { ConsultaItem, ConsultaKind } from '@/types/map-consulta'
import { PanelCard } from './PanelCard'
import { Segmented } from './Segmented'
import { changedFields, initialDraft, type EditDraft } from './helpers/explore-edit'

// Editar um registro no Explorar (DESIGN.md 19.3 e 19.5): o modo é dito em frase, o que mudou é o que vai, e o que foi escrito
// continua na tela se o salvamento falhar. Só entram campos descritivos; a localização e as chaves não se editam aqui (ADR 0012).

interface ExploreEditFormProps {
  item: ConsultaItem
  kind: ConsultaKind
  /** só o Superadmin altera o CAR (chave natural da Propriedade) */
  canEditCar: boolean
  /** grava; lança uma frase pronta em caso de falha */
  onSubmit: (fields: Record<string, string | null>) => Promise<void>
  onCancel: () => void
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs leading-snug text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function ExploreEditForm({ item, kind, canEditCar, onSubmit, onCancel }: ExploreEditFormProps) {
  const action = kind === 'acoes'
  const [initial] = useState(() => initialDraft(item, kind))
  const [draft, setDraft] = useState<EditDraft>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (key: string, value: string) => { setDraft((d) => ({ ...d, [key]: value })); setError(null) }

  const fields = changedFields(initial, draft)
  const changed = Object.keys(fields).length > 0
  const noName = draft.nome.trim() === ''
  const carEmpty = !action && canEditCar && draft.car.trim() === ''
  const blocked = !changed ? 'Mude algum campo para salvar.' : noName ? 'Escreva um nome para salvar.' : carEmpty ? 'O número do CAR não pode ficar vazio.' : null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (blocked || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSubmit(fields)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não conseguimos salvar agora.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" aria-label={action ? 'Editar ação' : 'Editar propriedade'}>
      <PanelCard title={action ? 'Editar ação' : 'Editar propriedade'} caption="Mude o que precisar. Só o que você alterar é salvo.">
        <div className="space-y-4">
          <Field id="edit-nome" label="Nome">
            <Input id="edit-nome" value={draft.nome} maxLength={255} onChange={(e) => set('nome', e.target.value)} aria-invalid={noName} />
          </Field>

          {action ? (
            <>
              <Field id="edit-status" label="Situação">
                <Segmented
                  label="Situação"
                  value={draft.status || ACAO_STATUS[0]}
                  options={ACAO_STATUS.map((s) => ({ value: s, label: s }))}
                  onChange={(v) => set('status', v)}
                />
              </Field>
              <Field id="edit-categoria" label="Tipo da ação">
                <Select value={draft.categoria} onValueChange={(v) => set('categoria', v)}>
                  <SelectTrigger id="edit-categoria"><SelectValue placeholder="Escolha o tipo" /></SelectTrigger>
                  <SelectContent>{ACAO_CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field id="edit-descricao" label="Descrição">
                <Textarea id="edit-descricao" value={draft.descricao} maxLength={255} rows={4} onChange={(e) => set('descricao', e.target.value)} placeholder="O que foi visto ou feito neste ponto." />
              </Field>
            </>
          ) : (
            <>
              <Field id="edit-titular" label="Titular">
                <Input id="edit-titular" value={draft.titular} maxLength={255} onChange={(e) => set('titular', e.target.value)} />
              </Field>
              <Field id="edit-municipio" label="Município">
                <Input id="edit-municipio" value={draft.municipio} maxLength={100} onChange={(e) => set('municipio', e.target.value)} />
              </Field>
              <Field id="edit-car" label="Número do CAR" hint={canEditCar ? 'É a chave da propriedade: mude só para corrigir um erro.' : 'Só a equipe técnica altera o número do CAR.'}>
                <Input id="edit-car" value={draft.car} maxLength={100} readOnly={!canEditCar} aria-readonly={!canEditCar} onChange={(e) => set('car', e.target.value)} className={canEditCar ? undefined : 'bg-muted text-muted-foreground'} />
              </Field>
            </>
          )}
        </div>
      </PanelCard>

      <div className="space-y-2 pt-6">
        <p className="text-xs leading-snug text-muted-foreground">
          {action ? 'Vale para todos que veem esta região.' : 'Propriedade é um dado compartilhado: vale para todas as organizações que a veem.'}
        </p>
        {error && <p role="alert" className="rounded-md border border-crit/70 bg-card p-3 text-sm leading-snug">{error}</p>}
        {!error && blocked && <p role="status" className="text-xs leading-snug text-muted-foreground">{blocked}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
          <Button type="submit" aria-disabled={!!blocked || saving} className={blocked ? 'opacity-60' : undefined}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </div>
    </form>
  )
}
