import { propertyLabel, propertyRows } from '../properties'

describe('propertyLabel', () => {
  it('lê os campos do arquivo de desmatamento como frases', () => {
    expect(propertyLabel('data_deteccao')).toBe('Data de detecção')
    expect(propertyLabel('area_ha')).toBe('Área (hectares)')
    expect(propertyLabel('municipio')).toBe('Município')
    expect(propertyLabel('classe')).toBe('Classe')
    expect(propertyLabel('ano')).toBe('Ano')
  })

  it('separa camelCase e mantém o que não conhece', () => {
    expect(propertyLabel('nomeFazenda')).toBe('Nome fazenda')
  })
})

describe('propertyRows', () => {
  const props = { id: 7, ano: 2023, data_deteccao: '2023-08-14', area_ha: 12.3456, municipio: 'Corumbá', classe: 'Desmatamento', nota: null, vazio: ' ' }

  it('mostra tudo que veio, menos o número de série e o que está vazio', () => {
    expect(propertyRows(props).map((r) => r.key)).toEqual(['ano', 'data_deteccao', 'area_ha', 'municipio', 'classe'])
  })

  it('formata ano, data e área', () => {
    const byKey = Object.fromEntries(propertyRows(props).map((r) => [r.key, r.value]))
    expect(byKey.ano).toBe('2023')
    expect(byKey.data_deteccao).toBe('14/08/2023')
    expect(byKey.area_ha).toBe('12,35')
  })

  it('aceita feição sem propriedades', () => {
    expect(propertyRows(null)).toEqual([])
    expect(propertyRows({})).toEqual([])
  })

  it('não mostra campos internos', () => {
    expect(propertyRows({ _slug: 'x', nome: 'a' }).map((r) => r.key)).toEqual(['nome'])
  })
})
