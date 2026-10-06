import { EXPORT_DPI, exportFileName, exportSize, slugify } from '../helpers/export-sheet'

describe('exportSize', () => {
  it('A4 deitada a 300 dpi: cerca de 3508 x 2480 pixels', () => {
    const s = exportSize(297, 210)
    expect(EXPORT_DPI).toBe(300)
    expect(Math.abs(s.outW - 3508)).toBeLessThanOrEqual(2)
    expect(Math.abs(s.outH - 2480)).toBeLessThanOrEqual(2)
  })

  it('A3 em pé a 300 dpi: cerca de 3508 x 4961 pixels', () => {
    const s = exportSize(297, 420)
    expect(Math.abs(s.outW - 3508)).toBeLessThanOrEqual(2)
    expect(Math.abs(s.outH - 4961)).toBeLessThanOrEqual(2)
  })

  it('a folha de exportação é medida em pixels de 96 dpi, e a razão leva ao tamanho final', () => {
    const s = exportSize(297, 210)
    expect(s.pxPerMm).toBeCloseTo(96 / 25.4, 6)
    expect(s.pixelRatio).toBeCloseTo(300 / 96, 6)
    expect(s.outW).toBe(Math.round(s.cssW * s.pixelRatio))
  })

  it('a folha nunca fica menor que o papel (arredonda para cima)', () => {
    const s = exportSize(297, 210)
    expect(s.cssW).toBeGreaterThanOrEqual(297 * s.pxPerMm)
    expect(s.cssH).toBeGreaterThanOrEqual(210 * s.pxPerMm)
  })
})

describe('slugify', () => {
  it('tira acento, pontuação e espaço sobrando', () => {
    expect(slugify('Focos de calor e Propriedades em São Paulo!')).toBe('focos-de-calor-e-propriedades-em-sao-paulo')
    expect(slugify('  Mapa   do  Rio da Prata  ')).toBe('mapa-do-rio-da-prata')
  })

  it('corta no limite sem terminar em hífen', () => {
    const out = slugify('a'.repeat(30) + ' ' + 'b'.repeat(40), 40)
    expect(out.length).toBeLessThanOrEqual(40)
    expect(out.endsWith('-')).toBe(false)
  })

  it('só símbolos: vazio', () => {
    expect(slugify('???')).toBe('')
  })
})

describe('exportFileName', () => {
  const day = new Date(2026, 9, 6, 15, 30)

  it('mapa, o título e a data de hoje, com a extensão do formato', () => {
    expect(exportFileName('Focos de calor em Rio da Prata', day, 'pdf')).toBe('mapa-focos-de-calor-em-rio-da-prata-2026-10-06.pdf')
    expect(exportFileName('Focos', day, 'png')).toBe('mapa-focos-2026-10-06.png')
  })

  it('título vazio ainda dá um nome', () => {
    expect(exportFileName('  ', day, 'pdf')).toBe('mapa-2026-10-06.pdf')
  })
})
