import { PAPERS, PAPER_LABELS, DEFAULT_SHEET, cornerRect, sheetLayout, zoomToFit } from '../helpers/sheet'

describe('sheetLayout', () => {
  it('A4 paisagem tem 297 x 210 mm; A4 retrato inverte', () => {
    expect(sheetLayout('a4', 'landscape')).toMatchObject({ width: 297, height: 210 })
    expect(sheetLayout('a4', 'portrait')).toMatchObject({ width: 210, height: 297 })
  })

  it('A3 paisagem tem 420 x 297 mm; A3 retrato inverte', () => {
    expect(sheetLayout('a3', 'landscape')).toMatchObject({ width: 420, height: 297 })
    expect(sheetLayout('a3', 'portrait')).toMatchObject({ width: 297, height: 420 })
  })

  it.each(PAPERS.flatMap((p) => (['landscape', 'portrait'] as const).map((o) => [p, o] as const)))(
    '%s %s: título, mapa e rodapé cabem na folha, sem se sobrepor',
    (paper, orientation) => {
      const s = sheetLayout(paper, orientation)
      for (const r of [s.header, s.map, s.footer]) {
        expect(r.x).toBeGreaterThanOrEqual(0)
        expect(r.y).toBeGreaterThanOrEqual(0)
        expect(r.x + r.w).toBeLessThanOrEqual(s.width)
        expect(r.y + r.h).toBeLessThanOrEqual(s.height)
      }
      expect(s.header.y + s.header.h).toBeLessThanOrEqual(s.map.y)
      expect(s.map.y + s.map.h).toBeLessThanOrEqual(s.footer.y)
    },
  )

  it('o mapa é a maior parte da folha', () => {
    const s = sheetLayout('a4', 'landscape')
    expect((s.map.w * s.map.h) / (s.width * s.height)).toBeGreaterThan(0.6)
  })

  it('a proporção do mapa acompanha a folha: paisagem é mais larga que alta, retrato o contrário', () => {
    const l = sheetLayout('a4', 'landscape').map
    const p = sheetLayout('a4', 'portrait').map
    expect(l.w).toBeGreaterThan(l.h)
    expect(p.h).toBeGreaterThan(p.w)
  })

  it('o padrão é A4 paisagem', () => {
    expect(DEFAULT_SHEET).toEqual({ paper: 'a4', orientation: 'landscape' })
  })

  it('todo papel tem rótulo escrito', () => {
    PAPERS.forEach((p) => expect(PAPER_LABELS[p]).toBeTruthy())
  })
})

describe('cornerRect', () => {
  const map = { x: 10, y: 30, w: 200, h: 100 }

  it('encosta o elemento no canto, com a folga pedida', () => {
    expect(cornerRect(map, 'top-left', 40, 20, 4)).toEqual({ x: 14, y: 34, w: 40, h: 20 })
    expect(cornerRect(map, 'top-right', 40, 20, 4)).toEqual({ x: 166, y: 34, w: 40, h: 20 })
    expect(cornerRect(map, 'bottom-left', 40, 20, 4)).toEqual({ x: 14, y: 106, w: 40, h: 20 })
    expect(cornerRect(map, 'bottom-right', 40, 20, 4)).toEqual({ x: 166, y: 106, w: 40, h: 20 })
  })

  it('o elemento nunca sai do mapa, mesmo que seja maior que ele', () => {
    const r = cornerRect(map, 'bottom-right', 500, 500, 4)
    expect(r.w).toBeLessThanOrEqual(map.w - 8)
    expect(r.h).toBeLessThanOrEqual(map.h - 8)
    expect(r.x).toBeGreaterThanOrEqual(map.x)
    expect(r.y).toBeGreaterThanOrEqual(map.y)
  })
})

describe('zoomToFit', () => {
  it('mantém o zoom quando a moldura tem o tamanho da tela', () => {
    expect(zoomToFit(10, { w: 1000, h: 600 }, { w: 1000, h: 600 })).toBeCloseTo(10)
  })

  it('moldura menor: afasta, para que tudo o que se via continue à vista', () => {
    expect(zoomToFit(10, { w: 1000, h: 600 }, { w: 500, h: 300 })).toBeCloseTo(9)
  })

  it('moldura maior: aproxima', () => {
    expect(zoomToFit(10, { w: 1000, h: 600 }, { w: 2000, h: 1200 })).toBeCloseTo(11)
  })

  it('o lado mais apertado decide (retrato numa tela de paisagem)', () => {
    // a moldura é 4x mais estreita, mas igual em altura: a largura manda
    expect(zoomToFit(10, { w: 1000, h: 600 }, { w: 250, h: 600 })).toBeCloseTo(8)
  })

  it('tela ou moldura sem tamanho não quebra: devolve o zoom de antes', () => {
    expect(zoomToFit(10, { w: 0, h: 0 }, { w: 500, h: 300 })).toBe(10)
    expect(zoomToFit(10, { w: 1000, h: 600 }, { w: 0, h: 0 })).toBe(10)
  })
})
