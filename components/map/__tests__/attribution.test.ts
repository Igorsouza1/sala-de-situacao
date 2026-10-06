import { collectAttributions, parseAttribution } from '../helpers/attribution'

describe('parseAttribution', () => {
  it('separa o texto dos links', () => {
    expect(parseAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors')).toEqual([
      { text: '© ' },
      { text: 'OpenStreetMap', href: 'https://www.openstreetmap.org/copyright' },
      { text: ' contributors' },
    ])
  })
  it('decodifica as entidades', () => {
    expect(parseAttribution('&copy; Esri &amp; parceiros')).toEqual([{ text: '© Esri & parceiros' }])
  })
  it('só deixa passar link http(s): javascript: vira texto', () => {
    const [part] = parseAttribution('<a href="javascript:alert(1)">clique</a>')
    expect(part).toEqual({ text: 'clique', href: undefined })
  })
  it('descarta qualquer outro elemento', () => {
    expect(parseAttribution('Mapa <script>x()</script><b>em negrito</b>')).toEqual([{ text: 'Mapa x()em negrito' }])
  })
  it('vazio não dá partes', () => {
    expect(parseAttribution('')).toEqual([])
  })
})

describe('collectAttributions', () => {
  it('junta a atribuição de cada fonte, sem repetir', () => {
    expect(collectAttributions({ sources: { a: { attribution: 'Esri' }, b: { attribution: 'Esri' }, c: { attribution: 'OSM' }, d: {} } })).toEqual(['Esri', 'OSM'])
  })
  it('sem estilo, nada', () => {
    expect(collectAttributions(null)).toEqual([])
  })
})
