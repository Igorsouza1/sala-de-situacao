import { buildRuleLegend } from '../helpers/legend-rules'

// as regras reais das Ações: ícone pela área, cor pela situação, e o caráter Ativo força cor e ícone
const config = {
  baseStyle: { color: '#64748b', iconName: 'map-pin' },
  rules: [
    { field: 'eixo_tematico', styleProperty: 'iconName', values: { Outros: 'help-circle', 'Vegetação': 'sprout', 'Solo & Relevo': 'mountain' } },
    { field: 'status', styleProperty: 'color', values: { Cancelado: '#94a3b8', Resolvido: '#16a34a', Identificado: '#dc2626' } },
    { field: 'carater', values: { Ativo: { color: '#15803d', iconName: 'sprout' } } },
  ],
}
const f = (properties: Record<string, unknown>) => ({ properties })

describe('buildRuleLegend', () => {
  it('sem regras ou sem feições, não há legenda', () => {
    expect(buildRuleLegend({ rules: [] }, [f({ status: 'Identificado' })])).toEqual([])
    expect(buildRuleLegend(config, [])).toEqual([])
    expect(buildRuleLegend(null, [f({})])).toEqual([])
  })

  it('só mostra o que está no mapa: nada de Cancelado se não há', () => {
    const [cor] = buildRuleLegend(config, [f({ status: 'Identificado', eixo_tematico: 'Outros' })])
    expect(cor.title).toBe('Cor')
    expect(cor.entries.map((e) => e.label)).toEqual(['Identificado'])
  })

  it('o caráter Ativo vence a situação e ganha o nome do campo', () => {
    const sections = buildRuleLegend(config, [f({ status: 'Identificado', carater: 'Ativo', eixo_tematico: 'Solo & Relevo' })])
    const cor = sections.find((s) => s.title === 'Cor')!
    expect(cor.entries.map((e) => e.label)).toEqual(['Caráter ativo'])
    expect(cor.entries[0].color).toBe('#15803d')
  })

  it('o que não casa nenhuma regra de cor vira "Demais", na cor base', () => {
    const cor = buildRuleLegend(config, [f({ status: 'Identificado' }), f({ status: 'Em Recuperação' })]).find((s) => s.title === 'Cor')!
    expect(cor.entries.map((e) => e.label)).toEqual(['Identificado', 'Demais'])
    expect(cor.entries[1].color).toBe('#64748b')
  })

  it('o ícone diz a área, na ordem das regras, e o Ativo troca o ícone', () => {
    const icone = buildRuleLegend(config, [f({ eixo_tematico: 'Solo & Relevo' }), f({ eixo_tematico: 'Outros' }), f({ eixo_tematico: 'Outros', carater: 'Ativo' })]).find((s) => s.title === 'Ícone')!
    expect(icone.entries.map((e) => e.label)).toEqual(['Outros', 'Solo & Relevo', 'Caráter ativo'])
  })

  it('compara sem diferenciar maiúsculas e minúsculas', () => {
    const cor = buildRuleLegend(config, [f({ status: 'identificado' })]).find((s) => s.title === 'Cor')!
    expect(cor.entries[0].color).toBe('#dc2626')
  })
})
