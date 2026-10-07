import { CORNERS, CORNER_LABELS, DEFAULT_LEGEND_CORNER, PAPERS, PAPER_LABELS, DEFAULT_SHEET, cornerAnchor, cornerRect, placeCorners, bandHeight, sheetLayout, titleFit, titleLayout, zoomToFit } from '../helpers/sheet'

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

describe('titleFit', () => {
  it('título curto usa o maior tamanho, em uma linha', () => {
    expect(titleFit('Focos de calor', 150)).toEqual({ size: 7.5, lines: 1 })
  })

  it('título médio desce um degrau e continua em uma linha', () => {
    expect(titleFit('x'.repeat(40), 150)).toEqual({ size: 6.5, lines: 1 })
  })

  it('título longo passa a duas linhas no menor tamanho, e nunca abaixo dele', () => {
    expect(titleFit('x'.repeat(60), 150)).toEqual({ size: 5.5, lines: 2 })
    expect(titleFit('x'.repeat(500), 150)).toEqual({ size: 5.5, lines: 2 })
  })

  it('com o logo ocupando espaço (menos largura) o título desce antes', () => {
    expect(titleFit('x'.repeat(30), 100).size).toBeLessThan(titleFit('x'.repeat(30), 250).size)
  })
})

describe('faixa do título com duas linhas', () => {
  it('cresce 6 mm e leva o mapa para baixo, sem o mapa passar do rodapé', () => {
    const one = sheetLayout('a4', 'portrait')
    const two = sheetLayout('a4', 'portrait', { headerLines: 2 })
    expect(two.header.h - one.header.h).toBe(6)
    expect(two.map.y - one.map.y).toBe(6)
    expect(two.map.y + two.map.h).toBeLessThanOrEqual(two.footer.y)
  })

  it('título que quebra em duas linhas na folha em pé cabe em uma na deitada', () => {
    const text = 'Focos de calor e desmatamento no Pantanal Norte em setembro de 2026'
    expect(titleLayout(text, 'a4', 'portrait', false).lines).toBe(2)
    expect(titleLayout(text, 'a4', 'landscape', false).lines).toBe(1)
  })

  it('o logo come largura: o mesmo título pode passar a duas linhas', () => {
    const text = 'x'.repeat(70)
    expect(titleLayout(text, 'a4', 'landscape', true).lines).toBeGreaterThanOrEqual(titleLayout(text, 'a4', 'landscape', false).lines)
  })
})

describe('modelos da folha', () => {
  type R = { x: number; y: number; w: number; h: number }
  const overlap = (a: R, b: R) => a.x < b.x + b.w - 1e-6 && b.x < a.x + a.w - 1e-6 && a.y < b.y + b.h - 1e-6 && b.y < a.y + a.h - 1e-6
  const combos = PAPERS.flatMap((p) => (['landscape', 'portrait'] as const).flatMap((o) => [true, false].map((margin) => [p, o, margin] as const)))

  it('um mapa: um painel só, o principal, igual ao mapa de sempre', () => {
    const s = sheetLayout('a4', 'landscape')
    expect(s.panels).toHaveLength(1)
    expect(s.panels[0]).toMatchObject({ main: true, rect: s.map })
  })

  it.each(combos)('lado a lado, %s %s (margem da grade %s): dois painéis, dentro da folha e sem se tocar', (paper, orientation, margin) => {
    const s = sheetLayout(paper, orientation, { model: 'side', gridMargin: margin })
    expect(s.panels.map((p) => p.label)).toEqual(['A', 'B'])
    expect(s.panels[0].main).toBe(true)
    expect(overlap(s.panels[0].rect, s.panels[1].rect)).toBe(false)
    for (const p of s.panels) {
      expect(p.rect.y).toBeGreaterThanOrEqual(s.header.y + s.header.h)
      expect(p.rect.y + p.rect.h).toBeLessThanOrEqual(s.footer.y + 1e-6)
    }
  })

  it.each(combos)('mapa e detalhes, %s %s (margem %s): de 1 a 4 detalhes, nenhum sobre o outro nem sobre o mapa grande', (paper, orientation, margin) => {
    for (const n of [1, 2, 3, 4]) {
      const s = sheetLayout(paper, orientation, { model: 'details', details: n, gridMargin: margin })
      expect(s.panels).toHaveLength(n + 1)
      expect(s.panels.slice(1).map((p) => p.label)).toEqual(Array.from({ length: n }, (_, i) => String(i + 1)))
      for (let i = 0; i < s.panels.length; i++) {
        for (let j = i + 1; j < s.panels.length; j++) expect(overlap(s.panels[i].rect, s.panels[j].rect)).toBe(false)
        expect(s.panels[i].rect.x + s.panels[i].rect.w).toBeLessThanOrEqual(s.width - 10 + 1e-6)
        expect(s.panels[i].rect.y + s.panels[i].rect.h).toBeLessThanOrEqual(s.footer.y + 1e-6)
      }
    }
  })

  it('os detalhes vão para uma coluna na folha deitada e para uma faixa na folha em pé', () => {
    const land = sheetLayout('a4', 'landscape', { model: 'details', details: 3 })
    const port = sheetLayout('a4', 'portrait', { model: 'details', details: 3 })
    expect(new Set(land.panels.slice(1).map((p) => p.rect.x)).size).toBe(1)
    expect(new Set(port.panels.slice(1).map((p) => p.rect.y)).size).toBe(1)
  })

  it('a coluna da legenda ao lado vale em qualquer modelo, mas só na folha deitada', () => {
    expect(sheetLayout('a4', 'landscape', { model: 'single', side: true }).side).not.toBeNull()
    expect(sheetLayout('a4', 'landscape', { model: 'details', side: true }).side).not.toBeNull()
    expect(sheetLayout('a4', 'landscape', { model: 'side', side: true }).side).not.toBeNull()
    expect(sheetLayout('a4', 'portrait', { model: 'side', side: true }).side).toBeNull()
  })
})

describe('faixa da legenda embaixo', () => {
  const rows = 12
  const combos = PAPERS.flatMap((p) => (['landscape', 'portrait'] as const).flatMap((o) => (['single', 'side', 'details'] as const).map((m) => [p, o, m] as const)))

  it.each(combos)('%s %s %s: a faixa fica entre os mapas e o rodapé, na largura toda, sem tocar em nada', (paper, orientation, model) => {
    const s = sheetLayout(paper, orientation, { model, below: true, legendRows: rows, gridMargin: true })
    expect(s.band).not.toBeNull()
    const band = s.band!
    expect(band.w).toBe(s.header.w)
    expect(band.y + band.h).toBeLessThanOrEqual(s.footer.y)
    // os mapas acabam antes da faixa; os números da grade, que moram fora do mapa principal, também
    for (const p of s.panels) expect(p.rect.y + p.rect.h).toBeLessThanOrEqual(band.y + 1e-6)
    expect(s.panels[0].rect.y + s.panels[0].rect.h + s.gridMargin).toBeLessThanOrEqual(band.y + 1e-6)
  })

  it('sem legenda, ou com a legenda em outro lugar, não há faixa nem área perdida', () => {
    expect(sheetLayout('a4', 'landscape', { below: true, legendRows: 0 }).band).toBeNull()
    expect(sheetLayout('a4', 'landscape', { legendRows: rows }).band).toBeNull()
    expect(sheetLayout('a4', 'landscape', { below: true, legendRows: 0 }).map).toEqual(sheetLayout('a4', 'landscape').map)
  })

  it('a faixa cresce com a legenda e a coluna a mais a encurta', () => {
    expect(bandHeight(20, 277)).toBeGreaterThan(bandHeight(5, 277))
    expect(bandHeight(12, 400)).toBeLessThan(bandHeight(12, 190))
    expect(bandHeight(0, 277)).toBe(0)
  })

  it('tira altura do mapa em vez de empurrar para fora da folha', () => {
    const without = sheetLayout('a4', 'landscape')
    const withBand = sheetLayout('a4', 'landscape', { below: true, legendRows: rows })
    expect(withBand.map.h).toBeLessThan(without.map.h)
    expect(withBand.map.y).toBe(without.map.y)
  })
})
