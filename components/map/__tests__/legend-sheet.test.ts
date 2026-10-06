import { EMPTY_LEGEND_EDITS, applyLegendEdits, buildLegend, isLegendEdited, moveBy, setSiblingOrder, type LegendSection } from '../helpers/legend-sheet'
import type { LayerManagerOption } from '../LayerManager'

const opt = (slug: string, label: string, extra: Partial<LayerManagerOption> = {}): LayerManagerOption => ({ id: slug, slug, label, color: '#000', ...extra })

const options: LayerManagerOption[] = [
  opt('raw_firms', 'Focos de calor'),
  opt('propriedades', 'Propriedades'),
  opt('acoes', 'Ações', { legendType: 'icon' }),
  opt('fauna', 'Fauna exótica', { subOptions: [opt('fauna__heatmap', 'Mapa de calor'), opt('fauna__locations', 'Localizações')] }),
]
const ruleLegends = {
  acoes: [
    { title: 'Cor' as const, entries: [{ key: 'status:Ativo', label: 'Ativo', color: '#1f4d3a' }, { key: 'base:color', label: 'Demais', color: '#888' }] },
    { title: 'Ícone' as const, entries: [{ key: 'area:Solo', label: 'Solo', iconName: 'mountain' }] },
  ],
}

describe('buildLegend', () => {
  it('só entra o que está ligado', () => {
    const [layers] = buildLegend(options, ['raw_firms'], {})
    expect(layers.items.map((i) => i.label)).toEqual(['Focos de calor'])
  })

  it('a ordem é a do mapa, e camadas simples ficam na primeira seção, sem título', () => {
    const sections = buildLegend(options, ['propriedades', 'raw_firms'], {})
    expect(sections).toHaveLength(1)
    expect(sections[0].title).toBeNull()
    expect(sections[0].items.map((i) => i.label)).toEqual(['Focos de calor', 'Propriedades'])
  })

  it('camada de pinos com regras sai da lista e vira as seções de cor e de ícone', () => {
    const sections = buildLegend(options, ['raw_firms', 'acoes'], ruleLegends)
    expect(sections.map((s) => s.title)).toEqual([null, 'Cor dos pinos', 'Ícone dos pinos'])
    expect(sections[0].items.map((i) => i.label)).toEqual(['Focos de calor'])
    expect(sections[1].items.map((i) => i.label)).toEqual(['Ativo', 'Demais'])
    expect(sections[2].items[0].swatch).toEqual({ kind: 'icon', iconName: 'mountain' })
    expect(sections[1].items[0].swatch).toEqual({ kind: 'color', color: '#1f4d3a' })
  })

  it('só pinos ligados: não sobra seção vazia sem título', () => {
    const sections = buildLegend(options, ['acoes'], ruleLegends)
    expect(sections.map((s) => s.title)).toEqual(['Cor dos pinos', 'Ícone dos pinos'])
  })

  it('camada com áreas leva só as áreas ligadas como filhas', () => {
    const [layers] = buildLegend(options, ['fauna__heatmap'], {})
    expect(layers.items).toHaveLength(1)
    expect(layers.items[0].children.map((c) => c.label)).toEqual(['Mapa de calor'])
  })

  it('nada ligado: sem seções', () => {
    expect(buildLegend(options, [], {})).toEqual([])
  })

  it('cada item tem um id próprio e estável', () => {
    const ids = buildLegend(options, ['raw_firms', 'acoes', 'fauna__heatmap'], ruleLegends).flatMap((s) => s.items.flatMap((i) => [i.id, ...i.children.map((c) => c.id)]))
    expect(new Set(ids).size).toBe(ids.length)
    expect(buildLegend(options, ['raw_firms'], {})[0].items[0].id).toBe('layer:raw_firms')
  })
})

describe('applyLegendEdits', () => {
  const base: LegendSection[] = buildLegend(options, ['raw_firms', 'propriedades', 'fauna__heatmap', 'fauna__locations'], {})
  const labels = (sections: LegendSection[]) => sections.flatMap((s) => s.items.map((i) => i.label))

  it('sem edições, a legenda fica como o mapa', () => {
    expect(applyLegendEdits(base, EMPTY_LEGEND_EDITS)).toEqual(base)
  })

  it('renomeia só na legenda, e o nome vazio volta ao original', () => {
    const out = applyLegendEdits(base, { ...EMPTY_LEGEND_EDITS, labels: { 'layer:raw_firms': 'Queimadas 2026', 'layer:propriedades': '   ' } })
    expect(labels(out)).toEqual(['Queimadas 2026', 'Propriedades', 'Fauna exótica'])
  })

  it('esconder tira da legenda, e os filhos vão junto', () => {
    const out = applyLegendEdits(base, { ...EMPTY_LEGEND_EDITS, hidden: ['layer:raw_firms', 'layer:fauna'] })
    expect(labels(out)).toEqual(['Propriedades'])
  })

  it('esconder um filho deixa o pai', () => {
    const out = applyLegendEdits(base, { ...EMPTY_LEGEND_EDITS, hidden: ['layer:fauna__heatmap'] })
    const fauna = out[0].items.find((i) => i.id === 'layer:fauna')!
    expect(fauna.children.map((c) => c.label)).toEqual(['Localizações'])
  })

  it('a ordem escolhida vale; o que não está na lista fica depois, na ordem de antes', () => {
    const out = applyLegendEdits(base, { ...EMPTY_LEGEND_EDITS, order: ['layer:propriedades', 'layer:raw_firms'] })
    expect(labels(out)).toEqual(['Propriedades', 'Focos de calor', 'Fauna exótica'])
    const partial = applyLegendEdits(base, { ...EMPTY_LEGEND_EDITS, order: ['layer:fauna'] })
    expect(labels(partial)).toEqual(['Fauna exótica', 'Focos de calor', 'Propriedades'])
  })

  it('reordena também os filhos entre si', () => {
    const out = applyLegendEdits(base, { ...EMPTY_LEGEND_EDITS, order: ['layer:fauna__locations', 'layer:fauna__heatmap'] })
    const fauna = out[0].items.find((i) => i.id === 'layer:fauna')!
    expect(fauna.children.map((c) => c.label)).toEqual(['Localizações', 'Mapa de calor'])
  })

  it('tudo escondido: a seção some, em vez de ficar vazia', () => {
    const out = applyLegendEdits(base, { ...EMPTY_LEGEND_EDITS, hidden: ['layer:raw_firms', 'layer:propriedades', 'layer:fauna'] })
    expect(out).toEqual([])
  })

  it('item que sai do mapa depois não quebra edições antigas', () => {
    const out = applyLegendEdits(base, { ...EMPTY_LEGEND_EDITS, labels: { 'layer:inexistente': 'x' }, hidden: ['layer:inexistente'], order: ['layer:inexistente'] })
    expect(labels(out)).toEqual(['Focos de calor', 'Propriedades', 'Fauna exótica'])
  })

  it('não altera a legenda original', () => {
    const copy = JSON.stringify(base)
    applyLegendEdits(base, { ...EMPTY_LEGEND_EDITS, labels: { 'layer:raw_firms': 'x' }, hidden: ['layer:propriedades'], order: ['layer:fauna'] })
    expect(JSON.stringify(base)).toBe(copy)
  })
})

describe('ordem entre irmãos', () => {
  it('setSiblingOrder troca a ordem dos irmãos sem mexer no resto', () => {
    expect(setSiblingOrder(['x', 'a', 'b'], ['b', 'a'])).toEqual(['x', 'b', 'a'])
  })

  it('moveBy sobe e desce uma casa, e para nas pontas', () => {
    expect(moveBy(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c'])
    expect(moveBy(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b'])
    expect(moveBy(['a', 'b', 'c'], 'a', -1)).toEqual(['a', 'b', 'c'])
    expect(moveBy(['a', 'b', 'c'], 'c', 1)).toEqual(['a', 'b', 'c'])
    expect(moveBy(['a', 'b'], 'z', 1)).toEqual(['a', 'b'])
  })
})

describe('isLegendEdited', () => {
  it('diz se há algo a desfazer', () => {
    expect(isLegendEdited(EMPTY_LEGEND_EDITS)).toBe(false)
    expect(isLegendEdited({ ...EMPTY_LEGEND_EDITS, title: 'Minha legenda' })).toBe(true)
    expect(isLegendEdited({ ...EMPTY_LEGEND_EDITS, labels: { a: 'b' } })).toBe(true)
    expect(isLegendEdited({ ...EMPTY_LEGEND_EDITS, hidden: ['a'] })).toBe(true)
    expect(isLegendEdited({ ...EMPTY_LEGEND_EDITS, order: ['a'] })).toBe(true)
  })

  it('título igual ao padrão ou só espaços não conta como edição', () => {
    expect(isLegendEdited({ ...EMPTY_LEGEND_EDITS, title: 'Legenda' })).toBe(false)
    expect(isLegendEdited({ ...EMPTY_LEGEND_EDITS, title: '  ' })).toBe(false)
  })
})
