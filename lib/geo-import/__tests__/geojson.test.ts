import { featureDate, problemMessage, readGeoJson } from '../geojson'

const poly = (x: number, y: number) => ({
  type: 'Polygon' as const,
  coordinates: [[[x, y], [x + 0.1, y], [x + 0.1, y + 0.1], [x, y + 0.1], [x, y]]],
})

const fc = (features: any[]) => JSON.stringify({ type: 'FeatureCollection', features })

describe('readGeoJson', () => {
  it('lê uma coleção de áreas e resume o que há nela', () => {
    const r = readGeoJson(
      fc([
        { type: 'Feature', geometry: poly(-57, -18), properties: { ano: 2019, data_deteccao: '2019-03-02', area_ha: 10 } },
        { type: 'Feature', geometry: poly(-56.5, -17.5), properties: { ano: 2025, data_deteccao: '2025-01-09', area_ha: 5 } },
      ]),
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.summary.count).toBe(2)
    expect(r.summary.kind).toBe('area')
    expect(r.summary.yearField).toBe('ano')
    expect(r.summary.dateField).toBe('data_deteccao')
    expect(r.summary.years).toEqual([2019, 2025])
    expect(r.summary.fields).toEqual(['ano', 'data_deteccao', 'area_ha'])
    expect(r.summary.bounds[0]).toBeCloseTo(-57)
  })

  it('aceita uma feição só e uma geometria solta', () => {
    expect(readGeoJson(JSON.stringify({ type: 'Feature', geometry: poly(-57, -18), properties: {} })).ok).toBe(true)
    const g = readGeoJson(JSON.stringify(poly(-57, -18)))
    expect(g.ok && g.summary.count).toBe(1)
  })

  it('descarta feições sem geometria e recusa quando não sobra nenhuma', () => {
    const some = readGeoJson(fc([{ type: 'Feature', geometry: null, properties: {} }, { type: 'Feature', geometry: poly(-57, -18), properties: {} }]))
    expect(some.ok && some.summary.count).toBe(1)
    const none = readGeoJson(fc([{ type: 'Feature', geometry: null, properties: {} }]))
    expect(none).toEqual({ ok: false, problem: { code: 'sem-geometria' } })
  })

  it('recusa texto que não é JSON e JSON que não é GeoJSON', () => {
    expect(readGeoJson('não sou json')).toEqual({ ok: false, problem: { code: 'json-invalido' } })
    expect(readGeoJson('{"a":1}')).toEqual({ ok: false, problem: { code: 'json-invalido' } })
  })

  it('recusa coordenadas em metros (UTM) e diz o que fazer', () => {
    const r = readGeoJson(fc([{ type: 'Feature', geometry: { type: 'Point', coordinates: [500000, 8000000] }, properties: {} }]))
    expect(r).toEqual({ ok: false, problem: { code: 'projetado' } })
    expect(problemMessage({ code: 'projetado' })).toMatch(/latitude e longitude/)
  })

  it('classifica pontos, linhas e mistos', () => {
    const pt = readGeoJson(fc([{ type: 'Feature', geometry: { type: 'Point', coordinates: [-57, -18] }, properties: {} }]))
    expect(pt.ok && pt.summary.kind).toBe('ponto')
    const ln = readGeoJson(fc([{ type: 'Feature', geometry: { type: 'LineString', coordinates: [[-57, -18], [-56, -17]] }, properties: {} }]))
    expect(ln.ok && ln.summary.kind).toBe('linha')
    const mix = readGeoJson(
      fc([
        { type: 'Feature', geometry: { type: 'Point', coordinates: [-57, -18] }, properties: {} },
        { type: 'Feature', geometry: poly(-57, -18), properties: {} },
      ]),
    )
    expect(mix.ok && mix.summary.kind).toBe('misto')
  })

  it('não toma por ano um campo que mal tem anos', () => {
    const r = readGeoJson(
      fc(Array.from({ length: 10 }, (_, i) => ({ type: 'Feature', geometry: poly(-57, -18), properties: { ano: i === 0 ? 2020 : 'n/d' } }))),
    )
    expect(r.ok && r.summary.yearField).toBeUndefined()
  })
})

describe('featureDate', () => {
  const now = new Date('2026-10-13T00:00:00Z')
  it('prefere a data do campo de data', () => {
    expect(featureDate({ d: '2025-01-09', a: 2019 }, { dateField: 'd', yearField: 'a' }, now).toISOString()).toBe('2025-01-09T12:00:00.000Z')
  })
  it('usa o meio do ano quando só há o ano', () => {
    expect(featureDate({ a: 2021 }, { yearField: 'a' }, now).getUTCFullYear()).toBe(2021)
  })
  it('cai para agora quando não há nada', () => {
    expect(featureDate({}, {}, now)).toBe(now)
  })
})
