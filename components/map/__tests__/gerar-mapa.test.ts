import { PRINT_BASEMAPS, autoTitle, composeSheetStyle, printBasemapFor } from '../helpers/gerar-mapa'

describe('printBasemapFor', () => {
  it('o que já é uma das três bases da folha fica como está', () => {
    PRINT_BASEMAPS.forEach((key) => expect(printBasemapFor(key)).toBe(key))
  })

  it('a base mais parecida entra no lugar das que a folha não oferece', () => {
    expect(printBasemapFor('satellite')).toBe('satellite-soft')
    expect(printBasemapFor('osm')).toBe('streets')
  })

  it('oferece no máximo 3 bases', () => {
    expect(PRINT_BASEMAPS.length).toBeLessThanOrEqual(3)
  })
})

describe('autoTitle', () => {
  it('uma camada: "Camada em Região"', () => {
    expect(autoTitle('Rio da Prata', ['Focos de calor'])).toBe('Focos de calor em Rio da Prata')
  })

  it('duas camadas: junta com "e"', () => {
    expect(autoTitle('Rio da Prata', ['Focos de calor', 'Propriedades'])).toBe('Focos de calor e Propriedades em Rio da Prata')
  })

  it('mais de duas: as duas primeiras e quantas ficaram de fora', () => {
    expect(autoTitle('Rio da Prata', ['A', 'B', 'C', 'D'])).toBe('A, B e mais 2 camadas em Rio da Prata')
    expect(autoTitle('Rio da Prata', ['A', 'B', 'C'])).toBe('A, B e mais 1 camada em Rio da Prata')
  })

  it('sem camadas: "Mapa de Região"', () => {
    expect(autoTitle('Rio da Prata', [])).toBe('Mapa de Rio da Prata')
  })

  it('sem região: só as camadas, ou "Mapa" quando não há nada', () => {
    expect(autoTitle(null, ['Focos de calor'])).toBe('Focos de calor')
    expect(autoTitle(null, [])).toBe('Mapa')
  })

  it('ignora nomes vazios e repetidos e arruma espaços', () => {
    expect(autoTitle('  Rio da Prata ', ['  Focos ', '', 'Focos'])).toBe('Focos em Rio da Prata')
  })
})

describe('composeSheetStyle', () => {
  const base = {
    version: 8,
    glyphs: 'g',
    sources: { fundo: { type: 'raster', attribution: 'Esri' } },
    layers: [{ id: 'fundo-layer', type: 'raster', source: 'fundo' }],
  }
  const snapshot = {
    version: 8,
    sources: {
      fundo: { type: 'raster' },
      dem: { type: 'raster-dem' },
      focos: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      'explorar-selecao': { type: 'geojson', data: {} },
    },
    layers: [
      { id: 'fundo-layer', type: 'raster', source: 'fundo' },
      { id: 'relevo', type: 'hillshade', source: 'dem' },
      { id: 'focos-circle', type: 'circle', source: 'focos' },
      { id: 'explorar-selecao-line', type: 'line', source: 'explorar-selecao' },
    ],
  }
  const hillshade = { source: { type: 'raster-dem' }, paint: { 'hillshade-exaggeration': 0.7 } }

  it('põe as camadas de dados por cima da base escolhida', () => {
    const out = composeSheetStyle(base, snapshot, ['focos'], null) as any
    expect(out.layers.map((l: any) => l.id)).toEqual(['fundo-layer', 'focos-circle'])
    expect(out.sources.focos).toBe(snapshot.sources.focos)
    expect(out.glyphs).toBe('g')
  })

  it('deixa de fora o que é só da tela (seleção do Explorar, relevo da base antiga)', () => {
    const out = composeSheetStyle(base, snapshot, ['focos'], null) as any
    expect(out.sources['explorar-selecao']).toBeUndefined()
    expect(out.layers.find((l: any) => l.id === 'explorar-selecao-line')).toBeUndefined()
    expect(out.layers.find((l: any) => l.id === 'relevo')).toBeUndefined()
  })

  it('não altera a base nem o retrato do mapa', () => {
    const baseCopy = JSON.stringify(base)
    const snapCopy = JSON.stringify(snapshot)
    composeSheetStyle(base, snapshot, ['focos'], hillshade)
    expect(JSON.stringify(base)).toBe(baseCopy)
    expect(JSON.stringify(snapshot)).toBe(snapCopy)
  })

  it('base com relevo sombreado: o sombreado fica entre a base e os dados', () => {
    const out = composeSheetStyle(base, snapshot, ['focos'], hillshade) as any
    expect(out.layers.map((l: any) => l.id)).toEqual(['fundo-layer', 'relevo', 'focos-circle'])
    expect(out.sources.dem).toEqual({ type: 'raster-dem' })
  })

  it('sem camadas de dados, devolve só a base', () => {
    const out = composeSheetStyle(base, snapshot, [], null) as any
    expect(out.layers.map((l: any) => l.id)).toEqual(['fundo-layer'])
  })

  it('sem retrato do mapa (ainda não carregou), devolve só a base', () => {
    const out = composeSheetStyle(base, null, ['focos'], null) as any
    expect(out.layers.map((l: any) => l.id)).toEqual(['fundo-layer'])
  })

  it('camadas de dados que a base já tem com o mesmo id não duplicam', () => {
    const out = composeSheetStyle(base, { ...snapshot, layers: [...snapshot.layers, { id: 'fundo-layer', type: 'raster', source: 'focos' }] }, ['focos'], null) as any
    expect(out.layers.filter((l: any) => l.id === 'fundo-layer')).toHaveLength(1)
  })
  it('"só estas": as camadas da fonte escolhida ganham o filtro; as outras ficam como estão', () => {
    const snap = {
      ...snapshot,
      sources: { ...snapshot.sources, propriedades: { type: 'geojson', data: {} } },
      layers: [...snapshot.layers, { id: 'propriedades-fill', type: 'fill', source: 'propriedades' }, { id: 'propriedades-line', type: 'line', source: 'propriedades', filter: ['==', ['get', 'x'], 1] }],
    }
    const out = composeSheetStyle(base, snap, ['focos', 'propriedades'], null, { source: 'propriedades', ids: [7, 9] }) as any
    const pick = ['in', ['get', 'id'], ['literal', [7, 9]]]
    expect(out.layers.find((l: any) => l.id === 'propriedades-fill').filter).toEqual(pick)
    expect(out.layers.find((l: any) => l.id === 'propriedades-line').filter).toEqual(['all', ['==', ['get', 'x'], 1], pick])
    expect(out.layers.find((l: any) => l.id === 'focos-circle').filter).toBeUndefined()
    expect(snap.layers[snap.layers.length - 2]).not.toHaveProperty('filter')
  })
})
