import { nomeDaArea, assuntosDaRegiao, desmatamentoPorAnoMes, ehCamadaDeDesmatamento, semAssunto, type Presenca } from '../fontes'

const nada: Presenca = { focos: false, desmatamento: false, javali: false, formoso: false, prata: false, cure: false }
const tudo: Presenca = { focos: true, desmatamento: true, javali: true, formoso: true, prata: true, cure: true }
const stats = { classes: [7, 9], ha: [[10, 5], [0, 0]] }
const fogo = { slug: 'fogo-mensal-x', name: 'Fogo Mensal ', schemaConfig: { kind: 'raster', raster: { mode: 'classes', legend: 'meses', years: [2018, 2019], stats } } }
const desmImportado = { slug: 'desmatamento-mapbiomas-dgd66', name: 'Desmatamento Mapbiomas', schemaConfig: { source: 'drop-import' } }

describe('assuntos da região', () => {
  it('Bonito: os assuntos das tabelas e das estações', () => {
    const a = assuntosDaRegiao([{ slug: 'raw_firms', name: 'Focos', schemaConfig: { sourceType: 'table' } }], tudo)
    expect(a).toMatchObject({ focos: true, desmatamento: { tipo: 'tabela' }, javali: true, formoso: true, prata: true, cure: true, fogoMensal: [] })
  })

  it('Rede Amolar: o fogo vem do raster mensal e o desmatamento da camada importada; as estações de Bonito não aparecem', () => {
    const a = assuntosDaRegiao([{ slug: 'rede-amolar', name: 'Rede Amolar', schemaConfig: { source: 'upload' } }, desmImportado, fogo], nada)
    expect(a.focos).toBe(false)
    expect(a.fogoMensal).toEqual([{ slug: 'fogo-mensal-x', nome: 'Fogo Mensal', years: [2018, 2019], stats }])
    expect(a.desmatamento).toEqual({ tipo: 'camada', slug: 'desmatamento-mapbiomas-dgd66', nome: 'Desmatamento Mapbiomas' })
    expect([a.javali, a.formoso, a.prata, a.cure]).toEqual([false, false, false, false])
    expect(semAssunto(a)).toBe(false)
  })

  it('a tabela de alertas manda sobre a camada importada', () => {
    expect(assuntosDaRegiao([desmImportado], { ...nada, desmatamento: true }).desmatamento).toEqual({ tipo: 'tabela' })
  })

  it('região sem nada diz que não tem assunto', () => {
    expect(semAssunto(assuntosDaRegiao([], nada))).toBe(true)
  })

  it('raster de uso do solo, ou de fogo sem a estatística, não vira fogo por mês', () => {
    const uso = { slug: 'uso', name: 'Uso do solo', schemaConfig: { kind: 'raster', raster: { mode: 'classes', legend: 'mapbiomas', years: [1985], stats: { classes: [3], ha: [[1]] } } } }
    const quebrado = { ...fogo, schemaConfig: { kind: 'raster', raster: { mode: 'classes', legend: 'meses', years: [2018, 2019], stats: { classes: [7], ha: [[1]] } } } }
    expect(assuntosDaRegiao([uso, quebrado], nada).fogoMensal).toEqual([])
  })

  it('reconhece a camada de desmatamento pelo nome, com ou sem acento, e nunca um raster ou a tabela', () => {
    expect(ehCamadaDeDesmatamento({ slug: 'nova-camada-1', name: 'Alertas de Desmatamento', schemaConfig: {} })).toBe(true)
    expect(ehCamadaDeDesmatamento({ slug: 'x', name: 'DESMATAMENTO 2024', schemaConfig: {} })).toBe(true)
    expect(ehCamadaDeDesmatamento({ slug: 'desmatamento', name: 'Desmatamento', schemaConfig: { sourceType: 'table' } })).toBe(false)
    expect(ehCamadaDeDesmatamento({ slug: 'desmat-raster', name: 'x', schemaConfig: { kind: 'raster' } })).toBe(false)
    expect(ehCamadaDeDesmatamento({ slug: 'rios', name: 'Rios', schemaConfig: {} })).toBe(false)
  })
})

describe('desmatamento de camada importada, por ano e mês', () => {
  it('lê a data e a área do MapBiomas Alerta', () => {
    const r = desmatamentoPorAnoMes([
      { properties: { ano: 2025, area_ha: 178.5787, data_deteccao: '2025-01-09' }, haGeom: 170 },
      { properties: { ano: 2025, area_ha: '12,5', data_deteccao: '2025-03-02' }, haGeom: null },
    ])
    expect(Object.keys(r)).toEqual(['2025'])
    expect(r[2025][0]).toBeCloseTo(178.5787)
    expect(r[2025][2]).toBe(12.5)
    expect(r[2025].reduce((a, b) => a + b, 0)).toBeCloseTo(191.0787)
  })

  it('sem área no atributo, usa a da geometria; sem data, o ano basta (entra em janeiro)', () => {
    const r = desmatamentoPorAnoMes([{ properties: { ANO: '2024' }, haGeom: 3.2 }])
    expect(r[2024][0]).toBe(3.2)
  })

  it('ignora o que não tem ano nem área', () => {
    expect(desmatamentoPorAnoMes([
      { properties: { classe: 'x' }, haGeom: 4 },
      { properties: { ano: 2023 }, haGeom: 0 },
      { properties: null, haGeom: null },
    ])).toEqual({})
  })
})

describe('recorte por área', () => {
  it('nome da área: o que as propriedades dizem, ou a camada', () => {
    expect(nomeDaArea({ NAME: 'Fazenda Acurizal' }, 'Rede Amolar')).toBe('Fazenda Acurizal')
    expect(nomeDaArea({ nome: '  ' }, 'APPs')).toBe('Área de APPs')
    expect(nomeDaArea(null, 'APPs')).toBe('Área de APPs')
  })
  it('no recorte vale só o pedaço do alerta dentro da área, não a área que o alerta diz', () => {
    const linhas = [{ properties: { area_ha: 100, data_deteccao: '2024-03-10' }, haGeom: 4 }]
    expect(desmatamentoPorAnoMes(linhas)[2024][2]).toBe(100)
    expect(desmatamentoPorAnoMes(linhas, { areaDaGeometria: true })[2024][2]).toBe(4)
  })
})
