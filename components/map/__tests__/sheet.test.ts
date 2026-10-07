import { CORNERS, CORNER_LABELS, DEFAULT_LEGEND_CORNER, PAPERS, PAPER_LABELS, DEFAULT_SHEET, cornerAnchor, cornerRect, placeCorners, sheetLayout, zoomToFit } from '../helpers/sheet'

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

describe('cornerAnchor', () => {
  it('encosta no canto pedido, com a folga', () => {
    expect(cornerAnchor('top-left', 4)).toEqual({ top: 4, left: 4 })
    expect(cornerAnchor('top-right', 4)).toEqual({ top: 4, right: 4 })
    expect(cornerAnchor('bottom-left', 4)).toEqual({ bottom: 4, left: 4 })
    expect(cornerAnchor('bottom-right', 4)).toEqual({ bottom: 4, right: 4 })
  })
})

describe('placeCorners', () => {
  it('com a legenda onde ela nasce (embaixo à direita), norte em cima à direita, escala embaixo à esquerda e localização em cima à esquerda', () => {
    expect(placeCorners(DEFAULT_LEGEND_CORNER)).toEqual({ legend: 'bottom-right', north: 'top-right', scale: 'bottom-left', inset: 'top-left' })
  })

  it.each(CORNERS)('legenda em %s: cada um num canto diferente', (legend) => {
    const p = placeCorners(legend)
    expect(p.legend).toBe(legend)
    expect(new Set([p.legend, p.north, p.scale, p.inset]).size).toBe(4)
  })

  it('a legenda tomando o canto do norte empurra o norte para outro canto', () => {
    expect(placeCorners('top-right').north).not.toBe('top-right')
  })

  it('todo canto tem rótulo escrito', () => {
    CORNERS.forEach((c) => expect(CORNER_LABELS[c]).toBeTruthy())
  })
})

describe('sheetLayout com o que o conteúdo pede', () => {
  const base = sheetLayout('a4', 'landscape')
  const inside = (outer: { x: number; y: number; w: number; h: number }, r: { x: number; y: number; w: number; h: number }) =>
    r.x >= outer.x && r.y >= outer.y && r.x + r.w <= outer.x + outer.w && r.y + r.h <= outer.y + outer.h

  it('sem pedidos, nada extra: sem coluna e sem margem', () => {
    expect(base.side).toBeNull()
    expect(base.gridMargin).toBe(0)
  })

  it('legenda ao lado na folha deitada: a coluna fica à direita do mapa, sem encostar, e o mapa perde largura', () => {
    const s = sheetLayout('a4', 'landscape', { side: true })
    expect(s.side).not.toBeNull()
    expect(s.map.x + s.map.w).toBeLessThan(s.side!.x)
    expect(s.side!.x + s.side!.w).toBeLessThanOrEqual(s.width)
    expect(s.map.w).toBeLessThan(base.map.w)
    expect(s.map.h).toBe(base.map.h)
  })

  it('a coluna ao lado vale para legenda e para texto, e só na folha deitada', () => {
    expect(sheetLayout('a3', 'landscape', { side: true }).side).not.toBeNull()
    expect(sheetLayout('a3', 'portrait', { side: true }).side).toBeNull()
  })

  it('legenda ao lado não vale na folha em pé: o layout fica como era', () => {
    expect(sheetLayout('a4', 'portrait', { side: true })).toEqual(sheetLayout('a4', 'portrait'))
  })

  it('números da grade na margem: o mapa encolhe e a margem cabe dentro da folha', () => {
    const s = sheetLayout('a3', 'portrait', { gridMargin: true })
    const plain = sheetLayout('a3', 'portrait')
    expect(s.gridMargin).toBeGreaterThan(0)
    expect(s.map.w).toBe(plain.map.w - s.gridMargin * 2)
    expect(s.map.h).toBe(plain.map.h - s.gridMargin * 2)
    const margin = { x: s.map.x - s.gridMargin, y: s.map.y - s.gridMargin, w: s.map.w + s.gridMargin * 2, h: s.map.h + s.gridMargin * 2 }
    expect(inside({ x: 0, y: 0, w: s.width, h: s.height }, margin)).toBe(true)
    expect(margin.y + margin.h).toBeLessThanOrEqual(s.footer.y)
  })

  it.each(PAPERS.flatMap((p) => (['landscape', 'portrait'] as const).map((o) => [p, o] as const)))(
    '%s %s: com tudo pedido ao mesmo tempo, mapa e coluna cabem na folha sem se sobrepor',
    (paper, orientation) => {
      const s = sheetLayout(paper, orientation, { side: true, gridMargin: true })
      const sheet = { x: 0, y: 0, w: s.width, h: s.height }
      for (const r of [s.map, s.footer, ...(s.side ? [s.side] : [])]) expect(inside(sheet, r)).toBe(true)
      expect(s.map.w).toBeGreaterThan(60)
      expect(s.map.h).toBeGreaterThan(60)
      if (s.side) expect(s.map.x + s.map.w + s.gridMargin).toBeLessThan(s.side.x)
    },
  )
})

describe('placeCorners com a legenda fora do mapa', () => {
  it('sem legenda sobre o mapa, os quatro cantos ficam livres e cada elemento tem o seu preferido', () => {
    expect(placeCorners(null)).toEqual({ legend: null, north: 'top-right', scale: 'bottom-left', inset: 'top-left' })
  })
})
