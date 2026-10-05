import { activeFilterCount, filterSummary } from '../helpers/filters'

const jan = new Date(2026, 0, 1)
const dez = new Date(2026, 11, 31)

describe('activeFilterCount', () => {
  it('conta período e tamanho como um filtro cada', () => {
    expect(activeFilterCount(null, null, {})).toBe(0)
    expect(activeFilterCount(jan, dez, {})).toBe(1)
    expect(activeFilterCount(null, null, { minArea: 0 })).toBe(1) // zero hectare ainda é um filtro
    expect(activeFilterCount(jan, null, { maxArea: 50 })).toBe(2)
  })
})

describe('filterSummary', () => {
  it('sem filtro, diz que mostra tudo', () => {
    expect(filterSummary(null, null, {})).toBe('Sem filtros: o mapa mostra tudo.')
  })

  it('junta período e tamanho numa frase só', () => {
    expect(filterSummary(jan, dez, { minArea: 100, maxArea: 500 })).toBe('Mostrando de 01/01/2026 a 31/12/2026 · propriedades de 100 a 500 ha.')
  })

  it('aceita só um lado de cada filtro', () => {
    expect(filterSummary(jan, null, { minArea: 100 })).toBe('Mostrando a partir de 01/01/2026 · propriedades a partir de 100 ha.')
    expect(filterSummary(null, dez, { maxArea: 50 })).toBe('Mostrando até 31/12/2026 · propriedades até 50 ha.')
  })
})
