import { requireAuthWithTenant } from "@/lib/api/require-auth"
import { apiError, apiSuccess } from "@/lib/api/responses"
import type { Caixa } from "@/lib/satelite"
import { buscarCenasDoAlerta } from "@/lib/service/sateliteService"

// GET /api/satelite/cenas?caixa=oeste,sul,leste,norte&data=2026-09-01 — a foto de antes e a de depois de um alerta (13.10).
// A caixa é a área da foto (o recorte em volta do alerta): a nuvem é medida só nela.
export async function GET(request: Request) {
  const { response } = await requireAuthWithTenant()
  if (response) return response

  const p = new URL(request.url).searchParams
  const partes = (p.get("caixa") ?? "").split(",").map(Number)
  const [w, s, e, n] = partes
  const valida = partes.length === 4 && partes.every(Number.isFinite)
    && Math.abs(w) <= 180 && Math.abs(e) <= 180 && Math.abs(s) <= 90 && Math.abs(n) <= 90 && w < e && s < n
    // uma foto de satélite tem poucos quilômetros: caixa maior que 1° não é um alerta
    && e - w <= 1 && n - s <= 1
  if (!valida) return apiError("Área inválida.", 400)
  const data = p.get("data") ?? ""
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(`${data}T00:00:00Z`))) return apiError("Data inválida.", 400)

  try {
    const cenas = await buscarCenasDoAlerta([w, s, e, n] as Caixa, data)
    const res = apiSuccess(cenas)
    // as fotos de uma data passada não mudam: o navegador guarda por uma hora
    res.headers.set("Cache-Control", "private, max-age=3600")
    return res
  } catch (error) {
    console.error("Erro ao buscar imagens de satélite:", error)
    return apiError("Não foi possível buscar as imagens de satélite.", 502)
  }
}
