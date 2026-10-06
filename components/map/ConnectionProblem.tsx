'use client'

import { CloudAlert, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// O aviso de que uma busca do mapa falhou (DESIGN.md 2.1 e 3.2), na voz do produto ("colega de campo": o "nós" quando o sistema age,
// frases curtas, nada técnico). Dois casos com saídas diferentes:
//  - SEM CONEXÃO: o aparelho não falou com o servidor. A frase diz isso, tranquiliza (nada foi perdido) e promete que tentamos de novo
//    sozinhos quando a internet voltar (uma tentativa automática, 2.1 regra 6), com o botão para adiantar.
//  - O SERVIDOR FALHOU: ele respondeu, mas não deu. Diz o que fazer.
// O texto cru do navegador ("Failed to fetch") nunca aparece. A frase que o servidor mandou (ex.: "Registro não encontrado") entra como apoio.

interface ConnectionProblemProps {
  offline: boolean
  /** o que não carregou, para a frase ("a lista", "o registro") */
  what: 'a lista' | 'o registro'
  /** a frase que o servidor mandou, quando mandou (só no caso do servidor) */
  detail?: string | null
  onRetry: () => void
  /** como o cartão se apresenta: solto na lista, ou como cartão no registro aberto */
  card?: boolean
}

export function ConnectionProblem({ offline, what, detail, onRetry, card }: ConnectionProblemProps) {
  const Icon = offline ? WifiOff : CloudAlert
  return (
    <div role="alert" className={cn('flex items-start gap-3 p-4', card && 'rounded-lg border border-warn/50 bg-card')}>
      {/* o âmbar é só do ícone, que vem com texto ao lado (4.2: nunca texto em âmbar) */}
      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warn/15 text-warn">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{offline ? 'Parece que você está sem conexão' : `Não conseguimos abrir ${what}`}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {offline
            ? `Não deu para buscar ${what} agora. Assim que a internet voltar, tentamos de novo.`
            : (detail ?? 'Algo falhou do nosso lado. O que você fez continua aqui.')}
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>{offline ? 'Tentar agora' : 'Tentar de novo'}</Button>
      </div>
    </div>
  )
}
