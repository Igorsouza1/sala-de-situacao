"use client"

import { useMemo, useState, type ReactNode } from "react"
import bbox from "@turf/bbox"
import type { Geometry } from "geojson"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { History, Satellite, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { contornoNoRecorte, nuvemEmPalavras, recorteDoAlerta, urlRecorteSentinel, type Caixa, type Cena, type CenasDoAlerta } from "@/lib/satelite"
import { useJson } from "./use-json"

const PX = 400

const dataLonga = (data: string) => format(parseISO(`${data}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: ptBR })

function Moldura({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-backwards motion-reduce:animate-none" style={{ animationDelay: "60ms" }}>
      <h5 className="text-sm font-medium text-muted-foreground">Antes e depois</h5>
      {children}
    </section>
  )
}

// Uma foto do satélite, só da área em volta do alerta. O contorno é um fio fino: o amarelo cheio escondia justamente o que mudou.
function Foto({ rotulo, cena, caixa, contorno }: { rotulo: string; cena: Cena | null; caixa: Caixa; contorno: string }) {
  const [carregada, setCarregada] = useState(false)
  const [falhou, setFalhou] = useState(false)
  return (
    <figure>
      <div className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
        {cena && !falhou ? (
          <>
            {!carregada && <Skeleton className="absolute inset-0 h-full w-full rounded-none" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlRecorteSentinel(cena.id, caixa, PX)}
              alt={`Satélite ${rotulo.toLowerCase()} do alerta, ${dataLonga(cena.data)}`}
              onLoad={() => setCarregada(true)}
              onError={() => setFalhou(true)}
              className={cn("h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none", carregada ? "opacity-100" : "opacity-0")}
            />
            {carregada && contorno && (
              <svg aria-hidden viewBox={`0 0 ${PX} ${PX}`} className="pointer-events-none absolute inset-0 h-full w-full animate-in fade-in-0 duration-500 motion-reduce:animate-none">
                <path d={contorno} fill="none" stroke="black" strokeOpacity={0.4} strokeWidth={4} strokeLinejoin="round" />
                <path d={contorno} fill="none" stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
              </svg>
            )}
          </>
        ) : (
          <p className="flex h-full items-center justify-center p-3 text-center text-xs text-muted-foreground">
            {falhou ? "Não foi possível carregar esta foto." : rotulo === "Antes" ? "Sem foto do satélite nos meses antes do alerta." : "Ainda sem foto do satélite depois do alerta."}
          </p>
        )}
      </div>
      <figcaption className="mt-2">
        <p className="text-sm font-medium">{rotulo}</p>
        {cena && (
          <>
            <p className="mt-0.5 text-xs text-muted-foreground">{dataLonga(cena.data)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{nuvemEmPalavras(cena.nuvem)}</p>
          </>
        )}
      </figcaption>
    </figure>
  )
}

// Só entra no ar depois do pedido: a busca no catálogo e as fotos não são pagas por quem nunca as quis ver.
function Comparador({ caixa, contorno, data }: { caixa: Caixa; contorno: string; data: string }) {
  const carga = useJson<CenasDoAlerta>(`/api/satelite/cenas?caixa=${caixa.map((v) => v.toFixed(6)).join(",")}&data=${data}`)
  const cenas = carga.data
  // 0 é a foto escolhida; cada pedido de "mais antiga" recua uma
  const [recuo, setRecuo] = useState(0)

  if (carga.estado === "carregando") {
    return (
      <div className="mt-3" aria-busy aria-label="Buscando as fotos do satélite">
        <div className="grid grid-cols-2 gap-3"><Skeleton className="aspect-square w-full" /><Skeleton className="aspect-square w-full" /></div>
        <p className="mt-3 text-sm text-muted-foreground">Buscando as fotos do satélite…</p>
      </div>
    )
  }
  if (carga.estado === "erro" || !cenas) {
    return (
      <div className="mt-2">
        <p className="text-sm">Não foi possível buscar as fotos do satélite.</p>
        <button type="button" onClick={carga.tentar} className="mt-2 min-h-10 rounded-sm px-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-secondary focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30">Tentar de novo</button>
      </div>
    )
  }
  const antes = recuo === 0 ? cenas.antes : cenas.antesMaisAntigas[recuo - 1] ?? cenas.antes
  const temMaisAntiga = recuo < cenas.antesMaisAntigas.length && antes != null
  const nublada = antes?.nublada || cenas.depois?.nublada
  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 gap-3">
        <Foto key={antes?.id ?? "sem-antes"} rotulo="Antes" cena={antes} caixa={caixa} contorno={contorno} />
        <Foto key={cenas.depois?.id ?? "sem-depois"} rotulo="Depois" cena={cenas.depois} caixa={caixa} contorno={contorno} />
      </div>
      {temMaisAntiga && (
        <button
          type="button"
          onClick={() => setRecuo((r) => r + 1)}
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-sm text-sm font-medium text-primary transition-colors duration-200 hover:bg-secondary focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
        >
          <History aria-hidden className="h-4 w-4" />
          O corte já aparece no Antes? Ver uma foto mais antiga
        </button>
      )}
      {nublada && (
        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <TriangleAlert aria-hidden className="mt-px h-3.5 w-3.5 flex-none text-warn" />
          Não há foto limpa neste período. Mostramos a que tem menos nuvem.
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">O fio branco é o contorno do alerta. Imagens Sentinel-2 (Copernicus/ESA), pelo Microsoft Planetary Computer.</p>
    </div>
  )
}

export function AntesDepois({ geometria, data }: { geometria: Geometry | null; data: string | null }) {
  const [pedido, setPedido] = useState(false)
  const area = useMemo(() => {
    if (!geometria) return null
    const alerta = bbox(geometria) as Caixa
    if (!alerta.every(Number.isFinite)) return null
    const caixa = recorteDoAlerta(alerta)
    return { caixa, contorno: contornoNoRecorte(geometria, caixa, PX) }
  }, [geometria])

  if (!data || !area) {
    return (
      <Moldura>
        <p className="mt-2 text-sm text-muted-foreground">
          {data ? "Sem o desenho do alerta não dá para recortar a foto do satélite." : "Sem a data do alerta não dá para escolher as fotos de antes e depois."}
        </p>
      </Moldura>
    )
  }
  return (
    <Moldura>
      {pedido ? (
        <Comparador caixa={area.caixa} contorno={area.contorno} data={data} />
      ) : (
        <>
          <p className="mt-2 text-sm">Veja como a área estava antes e depois deste alerta, em fotos do satélite.</p>
          <Button variant="outline" onClick={() => setPedido(true)} className="mt-3 min-h-10 w-full gap-2">
            <Satellite className="h-4 w-4" aria-hidden />
            Ver fotos do satélite
          </Button>
        </>
      )}
    </Moldura>
  )
}
