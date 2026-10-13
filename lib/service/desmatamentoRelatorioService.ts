import { findRelatorioDesmatamento, type OcorrenciaNaPropriedade } from "@/lib/repositories/desmatamentoRelatorioRepository"

function dia(valor: string | null): string | null {
  const match = valor?.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null
}

export function montarRelatorioDesmatamento(
  bruto: NonNullable<Awaited<ReturnType<typeof findRelatorioDesmatamento>>>,
) {
  const propriedades = new Map<number, {
    id: number
    nome: string | null
    codImovel: string | null
    areaPropriedade: number | null
    geometria: unknown
    ocorrencias: Array<{
      id: number; data: string | null; areaTotal: number | null
      areaNaPropriedade: number; geometria: unknown
    }>
  }>()

  for (const row of bruto.ocorrencias as OcorrenciaNaPropriedade[]) {
    let propriedade = propriedades.get(row.propriedadeId)
    if (!propriedade) {
      propriedade = {
        id: row.propriedadeId,
        nome: row.nome,
        codImovel: row.codImovel,
        areaPropriedade: row.areaPropriedade,
        geometria: row.geometriaPropriedade,
        ocorrencias: [],
      }
      propriedades.set(row.propriedadeId, propriedade)
    }
    propriedade.ocorrencias.push({
      id: row.alertaId,
      data: row.data,
      areaTotal: row.areaTotal,
      areaNaPropriedade: row.areaNaPropriedade,
      geometria: row.geometriaArea,
    })
  }

  const dataAtual = dia(bruto.alerta.data)
  return {
    alerta: bruto.alerta,
    propriedades: [...propriedades.values()].map(propriedade => {
      const atual = propriedade.ocorrencias.find(o => o.id === bruto.alerta.id)
      const outras = propriedade.ocorrencias.filter(o => o.id !== bruto.alerta.id)
      const anteriores = dataAtual ? outras.filter(o => {
        const data = dia(o.data)
        return data != null && data < dataAtual
      }) : []
      const ultimaAnterior = [...anteriores].sort((a, b) =>
        (dia(b.data) ?? "").localeCompare(dia(a.data) ?? ""),
      )[0]
      const maiorAnterior = [...anteriores].sort((a, b) => b.areaNaPropriedade - a.areaNaPropriedade)[0]
      return {
        ...propriedade,
        atual: atual ?? null,
        outras,
        anteriores: anteriores.length,
        dataComparavel: dataAtual != null,
        ocorrenciasSemData: outras.filter(o => dia(o.data) == null).length,
        comparacao: atual && ultimaAnterior ? {
          data: ultimaAnterior.data,
          areaAnterior: ultimaAnterior.areaNaPropriedade,
          diferenca: atual.areaNaPropriedade - ultimaAnterior.areaNaPropriedade,
        } : null,
        maiorAnterior: atual && maiorAnterior ? {
          data: maiorAnterior.data,
          area: maiorAnterior.areaNaPropriedade,
          diferenca: atual.areaNaPropriedade - maiorAnterior.areaNaPropriedade,
        } : null,
      }
    }),
  }
}

export async function getRelatorioDesmatamento(
  alertaId: number, tenantId: string, isSuperadmin: boolean, regiaoIds?: number | number[],
) {
  const bruto = await findRelatorioDesmatamento(alertaId, tenantId, isSuperadmin, regiaoIds)
  return bruto ? montarRelatorioDesmatamento(bruto) : null
}
