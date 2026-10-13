import { montarRelatorioDesmatamento } from "./desmatamentoRelatorioService"

const alerta = { id: 10, data: "2026-10-09", areaTotal: 12 }
const base = {
  propriedadeId: 1, nome: "Fazenda A", codImovel: "CAR-1",
  areaPropriedade: 100, geometriaPropriedade: {}, geometriaArea: {},
} as const

test("compara apenas áreas recortadas na propriedade e conta alertas anteriores", () => {
  const report = montarRelatorioDesmatamento({
    alerta,
    ocorrencias: [
      { ...base, alertaId: 10, data: "2026-10-09", areaTotal: 12, areaNaPropriedade: 3 },
      { ...base, alertaId: 9, data: "2025-06-01", areaTotal: 2, areaNaPropriedade: 1 },
      { ...base, alertaId: 8, data: "2024-02-01", areaTotal: 30, areaNaPropriedade: 5 },
    ],
  })

  expect(report.propriedades[0]).toMatchObject({
    anteriores: 2,
    atual: { areaNaPropriedade: 3 },
    comparacao: { areaAnterior: 1, diferenca: 2 },
    maiorAnterior: { area: 5, diferenca: -2 },
  })
  expect(report.propriedades[0].outras).toHaveLength(2)
})

test("mantém propriedades cruzadas separadas e não inventa precedência sem data", () => {
  const report = montarRelatorioDesmatamento({
    alerta: { ...alerta, data: null },
    ocorrencias: [
      { ...base, alertaId: 10, data: null, areaTotal: 12, areaNaPropriedade: 3 },
      { ...base, alertaId: 9, data: "2025-06-01", areaTotal: 2, areaNaPropriedade: 1 },
      { ...base, propriedadeId: 2, nome: "Fazenda B", alertaId: 10, data: null, areaTotal: 12, areaNaPropriedade: 8 },
    ],
  })

  expect(report.propriedades).toHaveLength(2)
  expect(report.propriedades[0]).toMatchObject({ anteriores: 0, dataComparavel: false, comparacao: null })
  expect(report.propriedades[1]).toMatchObject({ anteriores: 0, atual: { areaNaPropriedade: 8 }, outras: [] })
})
