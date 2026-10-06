'use client'

import * as LucideIcons from 'lucide-react'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { toPascalCase } from './helpers/map-visuals'
import { tidyText } from './helpers/text'

// Cartão que aparece ao passar o mouse numa ação (DESIGN.md 13.4). Responde a uma pergunta só: "que ação é esta e em que pé
// está?". Duas colunas: o ícone do marcador (mesma cor e mesmo ícone, vindos do mesmo cálculo do mapa) e, ao lado, tudo no
// MESMO eixo: nome, área, status e data. Hierarquia: nome (14, 600) → status (14) → área e data (12, cinza-tinta).
// O que é técnico (tipo técnico, caráter, mês, atuação) fica no modal. O texto de gente passa por tidyText (6.2, regra 11).

const STATUS_DOT: Record<string, string> = {
  'Identificado': 'bg-warn',
  'Em Recuperação': 'bg-water',
  'Concluído': 'bg-ok',
}

// dd/mm/aaaa: o serviço já manda pronto (time_formatado); sem ele, lê a data do campo bruto
function readDate(timeFormatado?: string, rawTime?: string): string | undefined {
  const ready = timeFormatado?.split(' ')[0]
  if (ready?.includes('/')) return ready
  const iso = rawTime?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : undefined
}

interface Props {
  properties: Record<string, any>
  /** cor e ícone do marcador: vêm do mesmo estilo que o mapa usa, nunca de um palpite (6.2, regra 13) */
  color?: string
  iconName?: string
}

export function AcaoHoverCard({ properties, color = 'var(--color-primary)', iconName }: Props) {
  const name = tidyText(properties.name || properties.acao) || 'Ação sem nome'
  // a área (eixo temático) é o que o ícone representa; sem ela, o tipo
  const area = tidyText(properties.eixo_tematico || properties.tipo)
  const status = properties.status as string | undefined
  const date = readDate(properties.time_formatado, properties.time)
  const Icon: React.ElementType = (iconName && (LucideIcons as any)[toPascalCase(iconName)]) || MapPin

  return (
    <div className="animate-hover-card pointer-events-none w-[272px] select-none overflow-hidden rounded-lg border border-border bg-card shadow-control">
      <div className="flex items-start gap-3 p-4">
        <span aria-hidden style={{ backgroundColor: color }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ring-white">
          <Icon size={18} color="white" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold leading-snug">{name}</h4>
          {area && <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground">{area}</p>}
          {status && (
            <p className="mt-3 flex items-center gap-2 text-sm">
              {status}
              {/* o ponto vem depois da palavra: assim o texto fica no mesmo eixo do título (6.2, regra 10) */}
              <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status] ?? 'bg-muted-foreground'}`} />
            </p>
          )}
          {date && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">Registrada em {date}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        Clique para ver os detalhes
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </div>
    </div>
  )
}
