import { buildGrid, datumLine, edgeCrossing, formatDms, fromUtm, toUtm, utmZone } from '../helpers/grid'

// Valores de referência: pyproj, SIRGAS 2000 / UTM 21S (EPSG:31981) e WGS84 / UTM 31N (EPSG:32631)
const REFERENCIAS: { lng: number; lat: number; e: number; n: number; zone?: number; tol: number }[] = [
  { lng: -56.6947, lat: -21.3278, e: 531659.784, n: 7641542.458, tol: 0.05 },
  { lng: -57.0, lat: -21.0, e: 500000, n: 7677852.362, tol: 0.05 },
  { lng: -60.0, lat: -25.0, e: 197181.312, n: 7231699.781, tol: 0.05 },
  // fora do fuso central (5° do meridiano): a série perde alguns centímetros, nada que apareça num mapa
  { lng: -54.3, lat: -20.1, e: 782335.693, n: 7775165.289, zone: 21, tol: 1 },
]

describe('utmZone', () => {
  it('cada fuso tem 6 graus, e o 21 começa em 60°W', () => {
    expect(utmZone(-56.69)).toBe(21)
    expect(utmZone(-60)).toBe(21)
    expect(utmZone(-60.0001)).toBe(20)
    expect(utmZone(-54)).toBe(22)
    expect(utmZone(2.29)).toBe(31)
  })
})

describe('toUtm', () => {
  it.each(REFERENCIAS)('bate com a referência em $lat, $lng', ({ lng, lat, e, n, zone, tol }) => {
    const u = toUtm(lat, lng, zone)
    expect(u.zone).toBe(zone ?? 21)
    expect(u.south).toBe(true)
    expect(Math.abs(u.easting - e)).toBeLessThan(tol)
    expect(Math.abs(u.northing - n)).toBeLessThan(tol)
  })

  it('hemisfério norte não soma o deslocamento de 10.000 km (Torre Eiffel, WGS84 / 31N)', () => {
    const u = toUtm(48.858333, 2.294444)
    expect(u.zone).toBe(31)
    expect(u.south).toBe(false)
    expect(Math.abs(u.easting - 448247.825)).toBeLessThan(0.05)
    expect(Math.abs(u.northing - 5411947.5)).toBeLessThan(0.05)
  })
})

describe('fromUtm', () => {
  it('desfaz toUtm, no sul e no norte', () => {
    for (const [lat, lng] of [[-21.3278, -56.6947], [-19.9, -57.4], [-24.5, -59.5], [48.858333, 2.294444], [0.5, -57.2]] as const) {
      const u = toUtm(lat, lng)
      const back = fromUtm(u.easting, u.northing, u.zone, u.south)
      expect(back.lat).toBeCloseTo(lat, 7)
      expect(back.lng).toBeCloseTo(lng, 7)
    }
  })
})

describe('formatDms', () => {
  it('graus, minutos e segundos com o hemisfério em letra', () => {
    expect(formatDms(-21.327778, 'lat', 'dms')).toBe(`21°19'40"S`)
    expect(formatDms(-56.694722, 'lng', 'dms')).toBe(`56°41'41"W`)
    expect(formatDms(2.294444, 'lng', 'dms')).toBe(`2°17'40"E`)
    expect(formatDms(48.858333, 'lat', 'dms')).toBe(`48°51'30"N`)
  })

  it('só o que importa: graus e minutos, ou só graus', () => {
    expect(formatDms(-21.327778, 'lat', 'dm')).toBe(`21°20'S`)
    expect(formatDms(-21.327778, 'lat', 'd')).toBe('21°S')
  })

  it('arredondar para cima nunca dá 60 segundos nem 60 minutos', () => {
    expect(formatDms(-20.9999999, 'lat', 'dms')).toBe(`21°00'00"S`)
    expect(formatDms(-20.9999999, 'lat', 'dm')).toBe(`21°00'S`)
    expect(formatDms(-20.499999, 'lat', 'dm')).toBe(`20°30'S`)
  })

  it('zero não tem hemisfério trocado por sinal negativo', () => {
    expect(formatDms(0, 'lat', 'dms')).toBe(`0°00'00"N`)
  })
})

describe('buildGrid em graus', () => {
  const bounds = { west: -56.7, south: -21.35, east: -56.5, north: -21.2 }
  const grid = buildGrid(bounds, 'dms')
  const meridians = grid.lines.filter((l) => l.axis === 'meridian')
  const parallels = grid.lines.filter((l) => l.axis === 'parallel')

  it('traz poucas linhas, nem de menos nem demais', () => {
    expect(meridians.length).toBeGreaterThanOrEqual(2)
    expect(meridians.length).toBeLessThanOrEqual(12)
    expect(parallels.length).toBeGreaterThanOrEqual(2)
    expect(parallels.length).toBeLessThanOrEqual(12)
  })

  it('todas as linhas caem dentro da área do mapa', () => {
    meridians.forEach((l) => l.points.forEach(([lng]) => {
      expect(lng).toBeGreaterThanOrEqual(bounds.west)
      expect(lng).toBeLessThanOrEqual(bounds.east)
    }))
    parallels.forEach((l) => l.points.forEach(([, lat]) => {
      expect(lat).toBeGreaterThanOrEqual(bounds.south)
      expect(lat).toBeLessThanOrEqual(bounds.north)
    }))
  })

  it('o intervalo é redondo: as linhas ficam em múltiplos de minuto, com o rótulo na precisão certa', () => {
    meridians.forEach((l) => expect(l.label).toMatch(/^\d+°\d{2}'W$/))
    parallels.forEach((l) => expect(l.label).toMatch(/^\d+°\d{2}'S$/))
  })

  it('o meridiano é uma reta vertical e o paralelo uma reta horizontal', () => {
    meridians.forEach((l) => expect(new Set(l.points.map(([lng]) => lng)).size).toBe(1))
    parallels.forEach((l) => expect(new Set(l.points.map(([, lat]) => lat)).size).toBe(1))
  })

  it('aproximar mostra segundos; afastar mostra graus', () => {
    const close = buildGrid({ west: -56.6950, south: -21.3290, east: -56.6930, north: -21.3270 }, 'dms')
    expect(close.lines.every((l) => /"[SW]$/.test(l.label))).toBe(true)
    const far = buildGrid({ west: -60, south: -25, east: -50, north: -15 }, 'dms')
    expect(far.lines.length).toBeGreaterThanOrEqual(4)
    expect(far.lines.every((l) => /^\d+°[SW]$/.test(l.label))).toBe(true)
  })

  it('área sem tamanho não quebra: devolve sem linhas', () => {
    expect(buildGrid({ west: -56, south: -21, east: -56, north: -21 }, 'dms').lines).toEqual([])
  })
})

describe('buildGrid em UTM', () => {
  const bounds = { west: -56.7, south: -21.35, east: -56.5, north: -21.2 }
  const grid = buildGrid(bounds, 'utm')

  it('as linhas são em metros redondos, com milhar separado', () => {
    expect(grid.lines.length).toBeGreaterThanOrEqual(4)
    grid.lines.forEach((l) => expect(l.label).toMatch(/^\d{1,3}(\.\d{3})+$/))
    grid.lines.forEach((l) => expect(Number(l.label.replace(/\./g, '')) % 1000).toBe(0))
  })

  it('cada linha de leste é (quase) vertical e cada linha de norte (quase) horizontal, e todas ficam perto da área', () => {
    grid.lines.forEach((l) => {
      expect(l.points.length).toBeGreaterThanOrEqual(2)
      l.points.forEach(([lng, lat]) => {
        expect(lng).toBeGreaterThan(bounds.west - 0.05)
        expect(lng).toBeLessThan(bounds.east + 0.05)
        expect(lat).toBeGreaterThan(bounds.south - 0.05)
        expect(lat).toBeLessThan(bounds.north + 0.05)
      })
    })
  })

  it('o fuso vem do centro do mapa', () => {
    expect(grid.zone).toBe(21)
    expect(grid.south).toBe(true)
  })
})

describe('datumLine', () => {
  it('em graus: datum e o tipo de coordenada', () => {
    expect(datumLine('dms', -56.6)).toBe('Datum SIRGAS 2000 · coordenadas geográficas')
  })

  it('em UTM: datum, fuso e hemisfério, e que os valores são em metros', () => {
    expect(datumLine('utm', -56.6, -21.3)).toBe('Datum SIRGAS 2000 · UTM fuso 21 Sul · metros')
    expect(datumLine('utm', -52.0, 5)).toBe('Datum SIRGAS 2000 · UTM fuso 22 Norte · metros')
  })
})

describe('edgeCrossing', () => {
  it('acha onde a linha cruza a borda de cima (y = 0) mesmo inclinada', () => {
    const line = [{ x: 100, y: 200 }, { x: 110, y: -20 }]
    const x = edgeCrossing(line, 'y', 0)!
    expect(x).toBeCloseTo(100 + (10 * 200) / 220, 5)
  })

  it('serve para a borda de lado também', () => {
    const line = [{ x: -10, y: 50 }, { x: 90, y: 70 }]
    expect(edgeCrossing(line, 'x', 0)).toBeCloseTo(52, 5)
  })

  it('linha que não chega até a borda: sem cruzamento', () => {
    expect(edgeCrossing([{ x: 10, y: 10 }, { x: 20, y: 30 }], 'y', 0)).toBeNull()
  })
})

describe('rótulos da grade UTM', () => {
  it('escrevem os metros com ponto de milhar, como em português (584.800), e nunca colados', () => {
    const { lines } = buildGrid({ west: -57.0, south: -21.4, east: -56.6, north: -21.0 }, 'utm')
    expect(lines.length).toBeGreaterThan(0)
    for (const l of lines) {
      expect(l.label).toMatch(/^\d{1,3}(\.\d{3})+$/)
      expect(l.label).not.toMatch(/\s/)
    }
  })
})
