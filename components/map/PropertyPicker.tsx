'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { ConnectionProblem } from './ConnectionProblem'
import { listParams } from './helpers/explore'
import { GENERIC_LIST_ERROR } from './helpers/network'
import { tidyText } from './helpers/text'
import { useConsultaList } from './useConsultaList'

// Escolher as propriedades que aparecem na folha (Gerar mapa). As escolhidas ficam no alto, ligadas; embaixo, a busca pelo nome com as
// que ainda não entraram. Cada linha é um interruptor na última coluna (19.1). Os estados: carregando (esqueleto), erro (frase e "Tentar de novo"),
// vazio (frase com o motivo) e "Mostrar mais".

export interface PickedProperty { id: number; nome: string }

function Line({ name, place, on, onToggle }: { name: string; place: string | null; on: boolean; onToggle: (on: boolean) => void }) {
  return (
    <li>
      <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-sm px-1 py-2 text-sm transition-colors duration-200 hover:bg-muted">
        <span className="min-w-0">
          <span className="block break-words">{name}</span>
          {place && <span className="mt-0.5 block text-xs text-muted-foreground">{place}</span>}
        </span>
        <Switch checked={on} onCheckedChange={onToggle} aria-label={`Mostrar ${name} na folha`} />
      </label>
    </li>
  )
}

export function PropertyPicker({ regiaoId, chosen, onChange }: { regiaoId?: number; chosen: PickedProperty[]; onChange: (next: PickedProperty[]) => void }) {
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  // a busca aplica sozinha, um instante depois da última tecla (2.2)
  useEffect(() => {
    const t = setTimeout(() => setQuery(draft.trim()), 350)
    return () => clearTimeout(t)
  }, [draft])

  const list = useConsultaList(listParams({ kind: 'propriedades', query, bounds: null, regiaoId }))
  const ids = new Set(chosen.map((c) => c.id))
  const rest = list.items.filter((i) => !ids.has(i.id))
  const loadingFirst = list.loading && list.items.length === 0

  return (
    <div className="space-y-4">
      {chosen.length > 0 && (
        <ul aria-label="Propriedades na folha" className="-my-1">
          {chosen.map((c) => (
            <Line key={c.id} name={tidyText(c.nome)} place={null} on onToggle={() => onChange(chosen.filter((x) => x.id !== c.id))} />
          ))}
        </ul>
      )}
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Buscar propriedade pelo nome" placeholder="Buscar pelo nome" value={draft} onChange={(e) => setDraft(e.target.value)} className="pl-9" />
      </div>
      <div aria-busy={list.loading}>
        {loadingFirst && (
          <div role="status" className="space-y-3">
            <span className="sr-only">Buscando…</span>
            <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" />
          </div>
        )}
        {rest.length > 0 && (
          <ul className="-my-1">
            {rest.map((i) => (
              <Line key={i.id} name={tidyText(i.nome)} place={i.municipio ? tidyText(i.municipio) : null} on={false} onToggle={() => onChange([...chosen, { id: i.id, nome: i.nome }])} />
            ))}
          </ul>
        )}
        {list.error && <ConnectionProblem offline={list.offline} what="a lista" detail={list.error === GENERIC_LIST_ERROR ? null : list.error} onRetry={list.retry} />}
        {!list.loading && !list.error && rest.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {list.items.length > 0 ? 'Todas as que apareceram na busca já estão na folha.' : query ? `Não achamos propriedade com “${query}”. Tente outra parte do nome.` : 'Não há propriedades nesta região.'}
          </p>
        )}
        {list.hasMore && !list.error && (
          <Button variant="outline" size="sm" className="mt-3 w-full" aria-disabled={list.loading} onClick={() => { if (!list.loading) list.loadMore() }}>
            {list.loading ? 'Carregando…' : 'Mostrar mais'}
          </Button>
        )}
      </div>
    </div>
  )
}
