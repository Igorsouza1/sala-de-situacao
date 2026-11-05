import { countByYear } from '../helpers/acoes-summary'
import { countRuleLegend } from '../helpers/legend-rules'

const f = (properties: Record<string, unknown>) => ({ properties })

// as regras reais das Ações (produção): ícone pela área, cor pela situação, e o caráter Ativo força cor e ícone
const config = {
  baseStyle: { color: '#64748b', iconName: 'map-pin' },
  rules: [
    { field: 'eixo_tematico', styleProperty: 'iconName', values: { 'Solo & Relevo': 'mountain', 'Fauna & Invasores': 'paw-print' } },
    { field: 'status', styleProperty: 'color', values: { Identificado: '#dc2626', Resolvido: '#16a34a' } },
    { field: 'carater', values: { Ativo: { color: '#15803d', iconName: 'sprout' } } },
  ],
}

describe('countRuleLegend', () => {
  const features = [
    f({ status: 'Identificado', eixo_tematico: 'Solo & Relevo' }),
    f({ status: 'Identificado', eixo_tematico: 'Solo & Relevo' }),
    f({ status: 'Em Recuperação', eixo_tematico: 'Fauna & Invasores' }),
    f({ status: 'Identificado', eixo_tematico: 'Solo & Relevo', carater: 'Ativo' }),
  ]

  it('conta pela cor do pino, como o mapa desenha (o Ativo vence a situação; sem regra vira "Demais")', () => {
    const cor = countRuleLegend(config, features).find((s) => s.title === 'Cor')!
    expect(cor.entries.map((e) => [e.label, e.count])).toEqual([['Identificado', 2], ['Caráter ativo', 1], ['Demais', 1]])
  })

  it('conta pelo ícone, do maior para o menor', () => {
    const icone = countRuleLegend(config, features).find((s) => s.title === 'Ícone')!
    expect(icone.entries.map((e) => [e.label, e.count])).toEqual([['Solo & Relevo', 2], ['Fauna & Invasores', 1], ['Caráter ativo', 1]])
  })

  it('as contas somam o total de pinos em cada bloco', () => {
    for (const s of countRuleLegend(config, features)) expect(s.entries.reduce((a, e) => a + e.count, 0)).toBe(features.length)
  })
})

describe('countByYear', () => {
  it('conta por ano e põe zero nos anos sem ação', () => {
    const r = countByYear([f({ time: '2022-03-01T10:00:00' }), f({ time: '2024-05-01' }), f({ time: '2024-06-01' })])
    expect(r.years).toEqual([{ year: 2022, count: 1 }, { year: 2023, count: 0 }, { year: 2024, count: 2 }])
    expect(r.undated).toBe(0)
  })

  it('separa as ações sem data', () => {
    const r = countByYear([f({ time: null }), f({}), f({ time: 'qualquer coisa' }), f({ time: '2026-01-02' })])
    expect(r.years).toEqual([{ year: 2026, count: 1 }])
    expect(r.undated).toBe(3)
  })

  it('sem nenhuma data, não há anos', () => {
    expect(countByYear([f({})])).toEqual({ years: [], undated: 1 })
  })
})

describe('grupos vindos do servidor (todas as ações, contadas por grupo)', () => {
  const groups = [
    { properties: { status: 'Identificado', eixo_tematico: 'Solo & Relevo', ano: 2023 }, count: 30 },
    { properties: { status: 'Em Recuperação', eixo_tematico: 'Fauna & Invasores', ano: 2026 }, count: 5 },
    { properties: { status: 'Identificado', eixo_tematico: 'Solo & Relevo', carater: 'Ativo', ano: null }, count: 2 },
  ]

  it('cada grupo vale pelo seu tamanho', () => {
    const cor = countRuleLegend(config, groups).find((s) => s.title === 'Cor')!
    expect(cor.entries.map((e) => [e.label, e.count])).toEqual([['Identificado', 30], ['Demais', 5], ['Caráter ativo', 2]])
  })

  it('o ano pode vir pronto, e o grupo sem ano soma nas sem data', () => {
    const r = countByYear(groups, 'ano')
    expect(r.years[0]).toEqual({ year: 2023, count: 30 })
    expect(r.years[r.years.length - 1]).toEqual({ year: 2026, count: 5 })
    expect(r.undated).toBe(2)
  })
})
