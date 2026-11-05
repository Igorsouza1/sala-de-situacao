"use client"

import { useMemo } from "react"
import { format, subDays } from "date-fns"
import { Droplets, Flame, MapPinOff, PawPrint, TreePine, Waves } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { AssuntosDaRegiao, FogoMensalFonte } from "@/lib/situacao/fontes"
import { semAssunto } from "@/lib/situacao/fontes"
import { Cartao } from "./cartao"
import { areaQueimada, desmatamento, focos, javali, quando, turbidez, visibilidade } from "./estado"
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

function CartaoFocos({ onAbrir, regiaoId }: { onAbrir: (a: Alvo) => void; regiaoId: number }) {
  const c = useJson<{ current: number; previous: number; sparkline: number[]; lastDate: string | null }>(`/api/fogo/indicador?regiao_id=${regiaoId}`)
  const r = focos(c.data?.current, c.data?.previous, c.data?.lastDate)
  return <Cartao titulo="Focos de calor" icone={Flame} estado={c.estado} tom={r.tom} frase={r.frase} apoio={r.apoio} serie={c.data?.sparkline} onAbrir={() => onAbrir({ tipo: "focos" })} onTentar={c.tentar} />
}

// A área queimada não pede nada ao servidor: os hectares por ano e mês foram calculados ao importar e moram na camada
export function CartaoFogoMensal({ fogo, onAbrir, area }: { fogo: FogoMensalFonte; onAbrir: (a: Alvo) => void; area?: string }) {
  const totais = useMemo(() => fogo.stats.ha.map((linha) => linha.reduce((a, b) => a + b, 0)), [fogo])
  const r = areaQueimada(fogo.years, totais)
  return (
    <Cartao
      titulo={`Área queimada · ${fogo.nome}`}
      icone={Flame}
      estado="pronto"
      tom={r.tom}
      frase={r.frase}
      apoio={r.apoio}
      serie={r.serie}
      onAbrir={() => onAbrir({ tipo: "fogoMensal", fogo, ...(area && { area }) })}
      onTentar={() => {}}
    />
  )
}

// Os alertas vêm da tabela (que recebe alerta novo todo dia) ou de uma camada importada da região: o cartão é o mesmo
function CartaoDesmatamento({ onAbrir, regiaoId, camada }: { onAbrir: (a: Alvo) => void; regiaoId: number; camada?: { slug: string; nome: string } }) {
  const url = camada
    ? `/api/situacao/desmatamento-camada?regiao_id=${regiaoId}&slug=${encodeURIComponent(camada.slug)}`
    : `/api/desmatamento/indicador?regiao_id=${regiaoId}`
  const c = useJson<Record<string, number[]>>(url)
  const r = desmatamento(c.data)
  return (
    <Cartao
      titulo={camada ? `Desmatamento · ${camada.nome}` : "Desmatamento"}
      icone={TreePine}
      estado={c.estado}
      tom={r.tom}
      frase={r.frase}
      apoio={r.apoio}
      serie={r.serie}
      onAbrir={() => onAbrir({ tipo: "desmatamento", ...(camada && { camada }) })}
      onTentar={c.tentar}
    />
  )
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

// Cada região mostra os assuntos que tem (DESIGN.md 13.10, "Uma Situação por região"): os de Bonito vêm das tabelas e das estações;
// os da Rede Amolar, das camadas importadas. A lista vem do servidor (`/api/situacao/assuntos`); a ordem é sempre a mesma.
export function Resumo({ onAbrir, regiaoId }: { onAbrir: (a: Alvo) => void; regiaoId?: number }) {
  const a = useJson<AssuntosDaRegiao>(regiaoId ? `/api/situacao/assuntos?regiao_id=${regiaoId}` : "")
  const intro = <p className="text-sm text-muted-foreground">Como está o território agora. Toque num assunto para ver o histórico.</p>

  if (!regiaoId || a.estado === "carregando") {
    return (
      <div className="space-y-4" aria-busy>
        {intro}
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-3 h-5 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (a.estado === "erro" || !a.data) {
    return (
      <div className="space-y-4">
        {intro}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium">Não foi possível ver o que esta região acompanha.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">O mapa continua funcionando.</p>
          <button
            type="button"
            onClick={a.tentar}
            className="mt-3 min-h-10 rounded-sm px-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-secondary focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
          >
            Tentar de novo
          </button>
        </div>
      </div>
    )
  }

  const s = a.data
  if (semAssunto(s)) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-9 flex-none place-items-center rounded-full bg-muted text-muted-foreground">
            <MapPinOff className="h-4 w-4" />
          </span>
          <p className="text-sm font-medium">Esta região ainda não tem dados de monitoramento</p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Os assuntos aparecem aqui quando a região tem focos de calor, alertas de desmatamento ou estações. Uma camada de fogo ou de
          desmatamento solta no mapa também passa a contar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {intro}
      {s.focos && <CartaoFocos onAbrir={onAbrir} regiaoId={regiaoId} />}
      {s.fogoMensal.map((f) => <CartaoFogoMensal key={f.slug} fogo={f} onAbrir={onAbrir} />)}
      {s.desmatamento && (
        <CartaoDesmatamento onAbrir={onAbrir} regiaoId={regiaoId} camada={s.desmatamento.tipo === "camada" ? { slug: s.desmatamento.slug, nome: s.desmatamento.nome } : undefined} />
      )}
      {s.javali && <CartaoJavali onAbrir={onAbrir} />}
      {s.formoso && <CartaoFormoso onAbrir={onAbrir} />}
      {s.prata && <CartaoPrata onAbrir={onAbrir} />}
      {s.cure && <CartaoCure onAbrir={onAbrir} />}
    </div>
  )
}
