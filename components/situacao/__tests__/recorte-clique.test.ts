import { recorteDoClique } from '../alvo'

const poligono = { type: 'Polygon' as const, coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] }

describe('recorteDoClique: que clique no mapa recorta a Situação', () => {
  it('um polígono de uma camada da região, com id', () => {
    expect(recorteDoClique('rede-amolar', 'Rede Amolar', { name: 'Faz. Acurizal' }, poligono, 276908)).toEqual({
      slug: 'rede-amolar', featureId: 276908, propriedades: { name: 'Faz. Acurizal' },
    })
  })
  it('multipolígono também', () => {
    expect(recorteDoClique('apps-1', 'APPs', {}, { type: 'MultiPolygon', coordinates: [poligono.coordinates] }, '12')).toMatchObject({ featureId: 12 })
  })
  it('ponto e linha não são área', () => {
    expect(recorteDoClique('nascentes', 'Nascentes', {}, { type: 'Point', coordinates: [0, 0] }, 1)).toBeNull()
    expect(recorteDoClique('rios', 'Rios', {}, { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, 1)).toBeNull()
  })
  it('sem id não dá para pedir a área inteira', () => {
    expect(recorteDoClique('rede-amolar', 'Rede Amolar', {}, poligono, undefined)).toBeNull()
  })
  it('camadas que já abrem outra coisa ou que são o próprio assunto não recortam', () => {
    expect(recorteDoClique('propriedades', 'Propriedades', {}, poligono, 1)).toBeNull()
    expect(recorteDoClique('desmatamento', 'Desmatamento', {}, poligono, 1)).toBeNull()
    expect(recorteDoClique('desmatamento-mapbiomas-dgd66', 'Desmatamento Mapbiomas', {}, poligono, 1)).toBeNull()
  })
})
