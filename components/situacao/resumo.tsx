"use client"

import { useMemo } from "react"
import { format, subDays } from "date-fns"
import { Droplets, Flame, PawPrint, TreePine, Waves } from "lucide-react"
import { Cartao } from "./cartao"
import { desmatamento, focos, javali, quando, turbidez, visibilidade } from "./estado"
import { useJson } from "./use-json"
import type { Alvo } from "./alvo"

// O resumo (DESIGN.md 19.2): um cartão por assunto, na ordem em que a pessoa pergunta "como está?": o que queima, o que derruba, os rios.
// Cada cartão mostra o estado de AGORA e a data do dado; nada é lembrado por usuário (o aviso de novidade é da Notificação por e-mail).
const SEM_SYNC = "Sem sincronização configurada: mostra o que já está guardado."

function periodo(dias: number) {
  const hoje = new Date()
  return `startDate=${format(subDays(hoje, dias), "yyyy-MM-dd")}&endDate=${format(hoje, "yyyy-MM-dd")}`
}

interface LinhaDia { data: string | null; [campo: string]: unknown }

const numero = (v: unknown): number | null => {
  if (v == null || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// a leitura mais recente que tem o campo pedido
function ultimaCom(linhas: LinhaDia[] | null, campo: string): LinhaDia | null {
  if (!linhas) return null
  return [...linhas]
    .filter((l) => l.data && numero(l[campo]) != null)
    .sort((a, b) => String(b.data).localeCompare(String(a.data)))[0] ?? null
}

function CartaoFocos({ onAbrir }: { onAbrir: (a: Alvo) => void }) {
  const c = useJson<{ current: number; previous: number; sparkline: number[]; lastDate: string | null }>("/api/fogo/indicador")
  const r = focos(c.data?.current, c.data?.previous, c.data?.lastDate)
  return <Cartao titulo="Focos de calor" icone={Flame} estado={c.estado} tom={r.tom} frase={r.frase} apoio={r.apoio} serie={c.data?.sparkline} onAbrir={() => onAbrir({ tipo: "focos" })} onTentar={c.tentar} />
}

function CartaoDesmatamento({ onAbrir }: { onAbrir: (a: Alvo) => void }) {
  const c = useJson<Record<string, number[]>>("/api/desmatamento/indicador")
  const r = desmatamento(c.data)
  return <Cartao titulo="Desmatamento" icone={TreePine} estado={c.estado} tom={r.tom} frase={r.frase} apoio={r.apoio} serie={r.serie} onAbrir={() => onAbrir({ tipo: "desmatamento" })} onTentar={c.tentar} />
}

function CartaoJavali({ onAbrir }: { onAbrir: (a: Alvo) => void }) {
  const c = useJson<{ thisMonth: number; lastMonth: number; sparkline: number[] }>("/api/javali-avistamentos/indicador")
  const r = javali(c.data?.thisMonth, c.data?.lastMonth)
  return <Cartao titulo="Javali" icone={PawPrint} estado={c.estado} tom={r.tom} frase={r.frase} apoio={r.apoio} serie={c.data?.sparkline} onAbrir={() => onAbrir({ tipo: "javali" })} onTentar={c.tentar} />
}

function CartaoFormoso({ onAbrir }: { onAbrir: (a: Alvo) => void }) {
  const url = useMemo(() => `/api/balneario-municipal/daily?${periodo(90)}`, [])
  const c = useJson<LinhaDia[]>(url)
  const ultima = ultimaCom(c.data, "turbidez")
  const qualquer = ultima ?? ultimaCom(c.data, "nivelAgua")
  const r = turbidez(numero(ultima?.turbidez))
  const serie = (c.data ?? [])
    .filter((l) => l.data && numero(l.turbidez) != null)
    .sort((a, b) => String(a.data).localeCompare(String(b.data)))
    .slice(-30)
    .map((l) => numero(l.turbidez) as number)
  const quandoFoi = quando(qualquer?.data)
  return (
    <Cartao
      titulo="Rio Formoso · Balneário"
      icone={Waves}
      estado={c.estado}
      tom={r.tom}
      frase={qualquer ? r.frase : "Sem coletas nos últimos 90 dias"}
      apoio={quandoFoi ? `Última coleta ${quandoFoi}` : null}
      serie={serie}
      onAbrir={() => onAbrir({ tipo: "formoso" })}
      onTentar={c.tentar}
    />
  )
}

function CartaoPrata({ onAbrir }: { onAbrir: (a: Alvo) => void }) {
  const c = useJson<{ current: number | null; sparkline: number[]; lastDate: string | null }>("/api/deque-pedras/indicadores/turbidez")
  const r = turbidez(c.data?.current)
  const quandoFoi = quando(c.data?.lastDate)
  return (
    <Cartao
      titulo="Rio da Prata · Deque de Pedras"
      icone={Droplets}
      estado={c.estado}
      tom={r.tom}
      frase={r.frase}
      apoio={quandoFoi ? `Última coleta ${quandoFoi}` : null}
      serie={c.data?.sparkline}
      aviso={SEM_SYNC}
      onAbrir={() => onAbrir({ tipo: "prata" })}
      onTentar={c.tentar}
    />
  )
}

function CartaoCure({ onAbrir }: { onAbrir: (a: Alvo) => void }) {
  const url = useMemo(() => `/api/ponte-cure/daily?${periodo(90)}`, [])
  const c = useJson<LinhaDia[]>(url)
  const ultima = c.data
    ? [...c.data].filter((l) => l.data).sort((a, b) => String(b.data).localeCompare(String(a.data)))[0] ?? null
    : null
  const r = visibilidade(ultima?.visibilidade as string | undefined)
  const serie = (c.data ?? [])
    .filter((l) => l.data && numero(l.nivel) != null)
    .sort((a, b) => String(a.data).localeCompare(String(b.data)))
    .slice(-30)
    .map((l) => numero(l.nivel) as number)
  const quandoFoi = quando(ultima?.data)
  return (
    <Cartao
      titulo="Ponte do Cure"
      icone={Waves}
      estado={c.estado}
      tom={r.tom}
      frase={ultima ? r.frase : "Sem registros nos últimos 90 dias"}
      apoio={quandoFoi ? `Último registro ${quandoFoi}` : null}
      serie={serie}
      aviso={SEM_SYNC}
      onAbrir={() => onAbrir({ tipo: "cure" })}
      onTentar={c.tentar}
    />
  )
}

export function Resumo({ onAbrir }: { onAbrir: (a: Alvo) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Como está o território agora. Toque num assunto para ver o histórico.</p>
      <CartaoFocos onAbrir={onAbrir} />
      <CartaoDesmatamento onAbrir={onAbrir} />
      <CartaoJavali onAbrir={onAbrir} />
      <CartaoFormoso onAbrir={onAbrir} />
      <CartaoPrata onAbrir={onAbrir} />
      <CartaoCure onAbrir={onAbrir} />
    </div>
  )
}
