import { LONG_LEGEND_ROWS, CLOSE_ZOOM, SECTION_IDS, SHEET_TARGETS, activeSection, autoLegendPlace, autoSheet, isSheetTarget } from '../helpers/gerar-sections'

describe('autoSheet', () => {
  const base = { viewport: { w: 1400, h: 800 }, zoom: 8 }

  it('trecho largo: folha deitada, legenda sobre o mapa, sem mapa de localização', () => {
    expect(autoSheet(base)).toEqual({ orientation: 'landscape', inset: false })
  })

  it('trecho mais alto que largo: folha em pé', () => {
    expect(autoSheet({ ...base, viewport: { w: 500, h: 900 } }).orientation).toBe('portrait')
  })

  it('quase quadrado fica deitada (a folha padrão)', () => {
    expect(autoSheet({ ...base, viewport: { w: 800, h: 850 } }).orientation).toBe('landscape')
  })

  it('um mapa: legenda longa vai para a coluna ao lado, mas só na folha deitada', () => {
    expect(autoLegendPlace('single', 'landscape', LONG_LEGEND_ROWS)).toBe('side')
    expect(autoLegendPlace('single', 'landscape', LONG_LEGEND_ROWS - 1)).toBe('over')
    expect(autoLegendPlace('single', 'portrait', 20)).toBe('over')
  })

  it('com mais de um mapa a legenda vai para a faixa de baixo, qualquer que seja a folha', () => {
    for (const model of ['side', 'details'] as const) {
      expect(autoLegendPlace(model, 'landscape', 2)).toBe('below')
      expect(autoLegendPlace(model, 'portrait', 30)).toBe('below')
    }
  })

  it('de perto, liga o mapa de localização', () => {
    expect(autoSheet({ ...base, zoom: CLOSE_ZOOM }).inset).toBe(true)
    expect(autoSheet({ ...base, zoom: CLOSE_ZOOM - 0.1 }).inset).toBe(false)
  })
})

describe('activeSection', () => {
  const tops = { folha: 0, cabecalho: 200, textos: 400, mapa: 900, legenda: 1300 }

  it('a seção à vista é a última cujo topo já passou da linha de leitura', () => {
    expect(activeSection(tops, 0, false)).toBe('folha')
    expect(activeSection(tops, 180, false)).toBe('cabecalho')
    expect(activeSection(tops, 450, false)).toBe('textos')
  })

  it('no fim da rolagem é a última, mesmo que ela seja curta demais para chegar ao topo', () => {
    expect(activeSection(tops, 1000, true)).toBe('legenda')
  })
})

describe('alvos da folha', () => {
  it('cada alvo leva a uma seção que existe', () => {
    for (const t of Object.values(SHEET_TARGETS)) expect(SECTION_IDS).toContain(t.section)
  })

  it('só chaves conhecidas são alvos', () => {
    expect(isSheetTarget('legenda')).toBe(true)
    expect(isSheetTarget('mapa')).toBe(false)
    // escala e localização só têm o interruptor: não são alvos
    expect(isSheetTarget('escala')).toBe(false)
    expect(isSheetTarget('localizacao')).toBe(false)
    expect(isSheetTarget(undefined)).toBe(false)
  })
})
