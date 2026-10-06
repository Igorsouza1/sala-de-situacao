import { areaText, dateText, listParams, placeText, propertyNames } from '../helpers/explore'

describe('dateText', () => {
  it('prefere o texto pronto do banco', () => {
    expect(dateText({ data: '2025-03-12T03:00:00.000Z', data_texto: '11/03/2025' })).toBe('11/03/2025')
  })
  it('lê a data bruta quando não há texto pronto', () => {
    expect(dateText({ data: '2025-03-12T10:00:00', data_texto: null })).toBe('12/03/2025')
  })
  it('sem data, não há texto', () => {
    expect(dateText({ data: null })).toBeNull()
  })
})

describe('placeText e propertyNames', () => {
  it('junta municípios sem repetir e arruma o texto', () => {
    const item = { municipio: null, propriedades: [{ id: 1, nome: 'a', municipio: 'BONITO' }, { id: 2, nome: 'b', municipio: 'Bonito' }, { id: 3, nome: 'c', municipio: 'Jardim' }] }
    expect(placeText(item)).toBe('Bonito · Jardim')
  })
  it('usa o município da própria propriedade', () => {
    expect(placeText({ municipio: 'Jardim' })).toBe('Jardim')
  })
  it('lista as propriedades sem repetir', () => {
    expect(propertyNames({ propriedades: [{ id: 1, nome: 'FAZENDA SANTA CLARA', municipio: null }, { id: 2, nome: 'Fazenda santa clara', municipio: null }] })).toEqual(['Fazenda santa clara'])
  })
})

describe('areaText', () => {
  it('usa o eixo e, sem ele, a categoria', () => {
    expect(areaText({ eixo_tematico: 'recuperação', categoria: 'Incidente' })).toBe('Recuperação')
    expect(areaText({ eixo_tematico: null, categoria: 'Incidente' })).toBe('Incidente')
  })
})

describe('listParams', () => {
  it('só leva o que foi escolhido', () => {
    expect(listParams({ kind: 'acoes', query: '', bounds: null })).toBe('kind=acoes')
  })
  it('leva busca, região, área e propriedade', () => {
    const qs = new URLSearchParams(listParams({ kind: 'acoes', query: 'aceiro', bounds: [-57, -22, -56, -21], regiaoId: 3, propriedadeId: 9 }))
    expect(qs.get('q')).toBe('aceiro')
    expect(qs.get('regiao_id')).toBe('3')
    expect(qs.get('bbox')).toBe('-57,-22,-56,-21')
    expect(qs.get('propriedade_id')).toBe('9')
  })
  it('a mesma entrada dá a mesma string', () => {
    const a = listParams({ kind: 'propriedades', query: 'x', bounds: null, regiaoId: 1 })
    expect(listParams({ kind: 'propriedades', query: 'x', bounds: null, regiaoId: 1 })).toBe(a)
  })
})
