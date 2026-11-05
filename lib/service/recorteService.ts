import { createInflate } from 'zlib'
import type { MultiPolygon, Polygon } from 'geojson'
import type { Grid } from '@/lib/geo-import/class-series'
import {
  lerAlertasDaCamadaNaArea,
  lerAlertasDaTabelaNaArea,
  lerAreaClicada,
  lerFontesDaRegiao,
  lerSerieRaster,
} from '@/lib/repositories/situacaoFontesRepository'
import { assuntosDaRegiao, desmatamentoPorAnoMes, nomeDaArea, type FogoMensalFonte } from '@/lib/situacao/fontes'
import { mascaraDoPoligono, SomaNoRecorte } from '@/lib/situacao/recorte-raster'

// O recorte da Situação: os assuntos da região, contados só dentro de uma área clicada no mapa (DESIGN.md 13.10).
// A área queimada é calculada pixel a pixel sobre a série gravada (a mesma do mapa); o desmatamento soma só o pedaço de cada alerta
// que cai dentro da área. Os mesmos formatos do resumo da região, para o cartão e o detalhe serem os mesmos.

export interface RecorteDaArea {
  area: { nome: string; camada: string; ha: number; geometria: Polygon | MultiPolygon }
  /** uma por raster de fogo da região, com os hectares de dentro da área; sem pixel da série na área, a camada não vem */
  fogoMensal: FogoMensalFonte[]
  /** hectares por ano e mês (o mesmo formato de /api/desmatamento); null quando a região não acompanha desmatamento */
  desmatamento: { camada?: { slug: string; nome: string }; porAnoMes: Record<number, number[]> } | null
}

// A série não muda (camada nova é outro slug): a conta de uma área vale enquanto o servidor estiver de pé.
const cache = new Map<string, FogoMensalFonte | null>()
const CACHE_MAX = 100

// a série comprimida (2 MB no fogo da Rede Amolar): guardada para o clique seguinte não buscar de novo no banco
const series = new Map<string, Promise<Awaited<ReturnType<typeof lerSerieRaster>>>>()
function serieGuardada(regiaoId: number, slug: string) {
  const chave = `${regiaoId}:${slug}`
  if (!series.has(chave)) {
    if (series.size >= 4) series.delete(series.keys().next().value!)
    series.set(chave, lerSerieRaster(regiaoId, slug).catch((e) => { series.delete(chave); throw e }))
  }
  return series.get(chave)!
}

function gradeDe(raster: Record<string, unknown>): Grid | null {
  const { width, height, bounds } = raster as { width?: number; height?: number; bounds?: [number, number, number, number] }
  if (!Number.isInteger(width) || !Number.isInteger(height) || !Array.isArray(bounds) || bounds.length !== 4) return null
  return { width: width!, height: height!, bounds }
}

async function fogoNaArea(regiaoId: number, fonte: FogoMensalFonte, featureId: number, geometria: Polygon | MultiPolygon): Promise<FogoMensalFonte | null> {
  const chave = `${fonte.slug}:${featureId}`
  if (cache.has(chave)) return cache.get(chave)!
  const serie = await serieGuardada(regiaoId, fonte.slug)
  const grade = serie && gradeDe(serie.raster)
  if (!serie || !grade) return null
  const mascara = mascaraDoPoligono(grade, geometria)
  let out: FogoMensalFonte | null = null
  if (mascara.length > 0) {
    const soma = new SomaNoRecorte(grade, mascara, fonte.years.length, fonte.stats.classes)
    await new Promise<void>((resolve, reject) => {
      const inflate = createInflate({ chunkSize: 1 << 20 })
      inflate.on('data', (pedaco: Buffer) => {
        try { soma.push(pedaco) } catch (e) { inflate.destroy(e as Error) }
      })
      inflate.on('end', resolve)
      inflate.on('error', reject)
      inflate.end(serie.data)
    })
    out = { ...fonte, stats: soma.finish() }
  }
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!)
  cache.set(chave, out)
  return out
}

/** null: a área não existe, não é polígono ou não é desta região (a rota responde 404). */
export async function recorteDaArea(regiaoId: number, slug: string, featureId: number): Promise<RecorteDaArea | null> {
  const [area, fontes] = await Promise.all([lerAreaClicada(regiaoId, slug, featureId), lerFontesDaRegiao(regiaoId)])
  if (!area || !fontes) return null
  const assuntos = assuntosDaRegiao(fontes.catalogo, fontes.presenca)

  const [fogo, alertas] = await Promise.all([
    Promise.all(assuntos.fogoMensal.map((f) => fogoNaArea(regiaoId, f, featureId, area.geometria))),
    !assuntos.desmatamento
      ? null
      : assuntos.desmatamento.tipo === 'tabela'
        ? lerAlertasDaTabelaNaArea(regiaoId, featureId)
        : lerAlertasDaCamadaNaArea(regiaoId, assuntos.desmatamento.slug, featureId),
  ])

  const d = assuntos.desmatamento
  return {
    area: { nome: nomeDaArea(area.properties, area.camada), camada: area.camada, ha: area.ha, geometria: area.geometria },
    fogoMensal: fogo.filter((f): f is FogoMensalFonte => f !== null),
    desmatamento: d && alertas
      ? { ...(d.tipo === 'camada' && { camada: { slug: d.slug, nome: d.nome } }), porAnoMes: desmatamentoPorAnoMes(alertas, { areaDaGeometria: true }) }
      : null,
  }
}
