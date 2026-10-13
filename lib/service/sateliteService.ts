import { escolherCenas, janelaDeBusca, nuvemLocal, paraMedir, type Caixa, type CenaStac, type CenasDoAlerta } from "@/lib/satelite"

const STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
const ESTATISTICAS = "https://planetarycomputer.microsoft.com/api/data/v1/item/statistics"

interface RespostaStac {
  features?: Array<{ id: string; properties?: { datetime?: string; "eo:cloud_cover"?: number } }>
}

interface RespostaEstatisticas {
  properties?: { statistics?: { SCL_b1?: { histogram?: [number[], number[]] } } }
}

// A nuvem da cena inteira (100 km) não diz se a área do alerta está limpa: uma cena "com poucas nuvens" pode ter uma
// nuvem bem em cima do alerta. Esta medida olha só a área da foto, pela classificação de cada ponto (banda SCL).
async function medirNuvemNaArea(itemId: string, caixa: Caixa): Promise<number | null> {
  const [w, s, e, n] = caixa
  try {
    const res = await fetch(`${ESTATISTICAS}?collection=sentinel-2-l2a&item=${encodeURIComponent(itemId)}&assets=SCL&categorical=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] },
      }),
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return null
    const histograma = ((await res.json()) as RespostaEstatisticas).properties?.statistics?.SCL_b1?.histogram
    return histograma ? nuvemLocal(histograma) : null
  } catch {
    return null
  }
}

// As fotos Sentinel-2 L2A que cobrem a área, na janela em volta do alerta (Microsoft Planetary Computer, sem chave).
export async function buscarCenasDoAlerta(caixa: Caixa, dataAlerta: string): Promise<CenasDoAlerta> {
  const lng = (caixa[0] + caixa[2]) / 2
  const lat = (caixa[1] + caixa[3]) / 2
  const { inicio, fim } = janelaDeBusca(dataAlerta)
  const res = await fetch(STAC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      collections: ["sentinel-2-l2a"],
      intersects: { type: "Point", coordinates: [lng, lat] },
      datetime: `${inicio}/${fim}`,
      sortby: [{ field: "datetime", direction: "desc" }],
      limit: 100,
      fields: { include: ["id", "properties.datetime", "properties.eo:cloud_cover"] },
    }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Catálogo de satélite respondeu ${res.status}`)
  const json = (await res.json()) as RespostaStac
  const cenas: CenaStac[] = (json.features ?? []).flatMap((f) => {
    const datetime = f.properties?.datetime
    const nuvem = f.properties?.["eo:cloud_cover"]
    return datetime && typeof nuvem === "number" ? [{ id: f.id, datetime, nuvem }] : []
  })

  // as primeiras de cada lado são medidas de perto, em paralelo; se a medida falhar, vale a nuvem da cena
  const medidas = new Map(
    await Promise.all(paraMedir(cenas, dataAlerta).map(async (id) => [id, await medirNuvemNaArea(id, caixa)] as const)),
  )
  const comNuvemLocal = cenas.map((c) => ({ ...c, nuvem: medidas.get(c.id) ?? c.nuvem }))
  return escolherCenas(comNuvemLocal, dataAlerta)
}
