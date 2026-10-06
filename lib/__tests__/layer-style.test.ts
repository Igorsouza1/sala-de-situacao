import { hasIconRule, ruleIcon, FILL_LEVELS, LINE_WEIGHTS, POINT_SIZES, applyEdit, applyStyle, deriveOutline, editableFields, isHexColor, layerShape, mainColor, nearestLevel, readEdit, readStyle, withMainColor, type LayerEdit } from '../layer-style'

// As camadas abaixo são cópias reduzidas das reais do catálogo (região 1, Bonito).
const propriedades = {
  category: 'Base Territorial',
  defaultVisibility: true,
  baseStyle: { type: 'polygon', color: '#000000', weight: 3, opacity: 1, fillColor: '#22c55e', fillOpacity: 0.2 },
  maplibre: { type: 'fill', paint: { 'fill-color': '#32a852', 'fill-opacity': 0.2 }, outlinePaint: { 'line-color': '#000000', 'line-width': 1.5, 'line-opacity': 1 } },
  popupFields: [{ key: 'nome', label: 'Nome' }],
}
const estradas = {
  category: 'Infraestrutura',
  baseStyle: { type: 'line', color: '#fef3c7', weight: 2, opacity: 0.9 },
  maplibre: { type: 'line', paint: { 'line-color': '#fef3c7', 'line-width': 2, 'line-opacity': 0.9 } },
}
const nascentes = {
  category: 'Base Territorial',
  baseStyle: { type: 'circle', color: '#ffffff', radius: 8, weight: 2, opacity: 1, fillColor: '#0ea5e9', fillOpacity: 1 },
  maplibre: { type: 'circle', paint: { 'circle-color': '#0ea5e9', 'circle-radius': 8, 'circle-opacity': 1, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 } },
}
const acoes = {
  category: 'Operacional',
  groupByColumn: 'eixo_tematico',
  baseStyle: { type: 'icon', color: '#64748b', radius: 28, iconName: 'map-pin' },
  rules: [{ field: 'eixo_tematico', styleProperty: 'iconName', values: { Vegetação: 'sprout', Monitoramento: 'activity', 'Recursos Hídricos': 'droplets' } }],
}
const semMaplibre = { category: 'Base Territorial', baseStyle: { type: 'polygon', color: '#2563eb', weight: 2, opacity: 1, fillColor: '#3b82f6', fillOpacity: 0 } }

describe('layerShape', () => {
  it('segue a precedência do mapa: o tipo do maplibre vence; depois a geometria; depois o estilo', () => {
    expect(layerShape(propriedades)).toBe('fill')
    expect(layerShape(estradas)).toBe('line')
    expect(layerShape(nascentes)).toBe('circle')
    expect(layerShape(acoes)).toBe('icon')
    expect(layerShape(semMaplibre)).toBe('fill')
    expect(layerShape({ baseStyle: { type: 'line' } })).toBe('line')
    expect(layerShape({}, 'Point')).toBe('circle') // sem estilo nenhum, a geometria decide
    expect(layerShape(null)).toBe('fill')
    expect(layerShape({ maplibre: { type: 'heatmap' } })).toBe('other')
  })
})

describe('readStyle: lê o que o mapa desenha, não o que a legenda dizia', () => {
  it('polígono com maplibre: o miolo é o do paint (#32a852), não o do baseStyle (#22c55e)', () => {
    const s = readStyle(propriedades)
    expect(s.fillColor).toBe('#32a852')
    expect(s.color).toBe('#000000')
    expect(s.weight).toBe(1.5) // outlinePaint vence o baseStyle (3)
    expect(s.fillOpacity).toBe(0.2)
  })

  it('ponto com borda branca: o miolo é azul e a borda é branca (a legenda pintava tudo de branco)', () => {
    const s = readStyle(nascentes)
    expect(s.fillColor).toBe('#0ea5e9')
    expect(s.color).toBe('#ffffff')
    expect(s.weight).toBe(1.5)
    expect(s.radius).toBe(8)
  })

  it('sem maplibre, cai no baseStyle e respeita preenchimento 0 (Bacia e Município desenham só o contorno)', () => {
    const s = readStyle(semMaplibre)
    expect(s.fillOpacity).toBe(0)
    expect(s.color).toBe('#2563eb')
  })

  it('camada sem estilo nenhum usa o azul de reserva do mapa', () => {
    expect(readStyle(null).fillColor).toBe('#3b82f6')
    expect(readStyle({ category: 'Uploads' }).color).toBe('#3b82f6')
  })

  it('ícone lê cor e nome do ícone', () => {
    const s = readStyle(acoes)
    expect(s.shape).toBe('icon')
    expect(s.color).toBe('#64748b')
    expect(s.iconName).toBe('map-pin')
  })
})

describe('applyStyle: grava nos dois lugares e preserva o resto', () => {
  it('polígono: muda o paint (o que o mapa lê) e o baseStyle (o que o Leaflet lê), sem tocar no resto', () => {
    const style = { ...readStyle(propriedades), fillColor: '#c8431a', fillOpacity: 0.4, color: '#181a19', weight: 2 }
    const out = applyStyle(propriedades, style)
    expect(out.maplibre.paint).toEqual({ 'fill-color': '#c8431a', 'fill-opacity': 0.4 })
    expect(out.maplibre.outlinePaint).toEqual({ 'line-color': '#181a19', 'line-width': 2, 'line-opacity': 1 })
    expect(out.baseStyle).toMatchObject({ fillColor: '#c8431a', fillOpacity: 0.4, color: '#181a19', weight: 2, type: 'polygon' })
    expect(out.popupFields).toEqual(propriedades.popupFields)
    expect(out.maplibre.type).toBe('fill')
  })

  it('o que foi gravado é o que se lê de volta (ida e volta), para todos os tipos', () => {
    for (const vc of [propriedades, estradas, nascentes, acoes, semMaplibre]) {
      const before = readStyle(vc)
      const after = readStyle(applyStyle(vc, before))
      expect(after).toEqual(before)
    }
  })

  it('não altera o objeto original', () => {
    const copia = JSON.parse(JSON.stringify(estradas))
    applyStyle(estradas, { ...readStyle(estradas), color: '#2a7da6' })
    expect(estradas).toEqual(copia)
  })

  it('linha: muda cor e espessura nos dois lugares', () => {
    const out = applyStyle(estradas, { ...readStyle(estradas), color: '#2a7da6', weight: 4 })
    expect(out.maplibre.paint).toMatchObject({ 'line-color': '#2a7da6', 'line-width': 4 })
    expect(out.baseStyle).toMatchObject({ color: '#2a7da6', weight: 4 })
  })

  it('ponto com paint: miolo, borda e raio vão para o paint; o baseStyle segue a semântica do Leaflet', () => {
    const out = applyStyle(nascentes, { ...readStyle(nascentes), fillColor: '#2e7d5b', color: '#ffffff', radius: 10 })
    expect(out.maplibre.paint).toMatchObject({ 'circle-color': '#2e7d5b', 'circle-radius': 10, 'circle-stroke-color': '#ffffff' })
    expect(out.baseStyle).toMatchObject({ color: '#ffffff', fillColor: '#2e7d5b', radius: 10 })
  })

  it('ponto sem paint: o mapa pinta com `color`, então o miolo vai para `color`', () => {
    const sem = { baseStyle: { type: 'circle', color: '#111111', radius: 5 } }
    const out = applyStyle(sem, { ...readStyle(sem), fillColor: '#e09a00' })
    expect(out.baseStyle.color).toBe('#e09a00')
    expect(readStyle(out).fillColor).toBe('#e09a00')
  })

  it('camada sem maplibre não ganha um: o mapa continua caindo no baseStyle', () => {
    const out = applyStyle(semMaplibre, { ...readStyle(semMaplibre), color: '#c8431a' })
    expect(out.maplibre).toBeUndefined()
    expect(out.baseStyle.color).toBe('#c8431a')
  })

  it('visual_config "plano" (sem baseStyle) não perde as chaves ao ganhar um baseStyle', () => {
    const plano = { type: 'line', color: '#111111', weight: 3, dashArray: '4 2' }
    const out = applyStyle(plano, { ...readStyle(plano), color: '#2a7da6' })
    expect(out.baseStyle).toMatchObject({ type: 'line', weight: 3, dashArray: '4 2', color: '#2a7da6' })
  })

  it('ícone: troca cor e nome do ícone, e mantém as regras por valor', () => {
    const out = applyStyle(acoes, { ...readStyle(acoes), color: '#2e7d5b', iconName: 'sprout' })
    expect(out.baseStyle).toMatchObject({ color: '#2e7d5b', iconName: 'sprout', radius: 28 })
    expect(out.rules).toEqual(acoes.rules)
    expect(out.groupByColumn).toBe('eixo_tematico')
  })
})

describe('applyEdit e readEdit', () => {
  it('grava seção e "abre ligada" junto da aparência', () => {
    const edit: LayerEdit = { ...readEdit({ name: 'Estradas', visualConfig: estradas }), category: 'Monitoramento', defaultVisibility: true }
    const out = applyEdit(estradas, edit)
    expect(out.category).toBe('Monitoramento')
    expect(out.defaultVisibility).toBe(true)
  })

  it('"abre ligada" sem valor no catálogo vale o padrão do código; com valor, o do catálogo', () => {
    expect(readEdit({ name: 'x', visualConfig: estradas }, { defaultVisibleFallback: true }).defaultVisibility).toBe(true)
    expect(readEdit({ name: 'x', visualConfig: estradas }).defaultVisibility).toBe(false)
    expect(readEdit({ name: 'x', visualConfig: { ...estradas, defaultVisibility: false } }, { defaultVisibleFallback: true }).defaultVisibility).toBe(false)
  })

  it('seção desconhecida volta a Base Territorial em vez de quebrar', () => {
    expect(readEdit({ name: 'x', visualConfig: { category: 'Outra' } }).category).toBe('Base Territorial')
    expect(readEdit({ name: 'x', visualConfig: null }).category).toBe('Base Territorial')
  })
})

describe('editableFields', () => {
  it('cada tipo mostra só o que faz sentido', () => {
    expect(editableFields('fill')).toEqual({ stroke: true, fill: true, fillOpacity: true, weight: true, radius: false, icon: false })
    expect(editableFields('line')).toMatchObject({ fill: false, weight: true, icon: false })
    expect(editableFields('circle')).toMatchObject({ fill: true, radius: true, fillOpacity: false })
    expect(editableFields('icon')).toMatchObject({ icon: true, weight: false, fill: false })
    expect(editableFields('other').stroke).toBe(false)
  })
})

describe('isHexColor', () => {
  it('aceita #rgb e #rrggbb; recusa o resto', () => {
    expect(isHexColor('#c8431a')).toBe(true)
    expect(isHexColor('#fff')).toBe(true)
    expect(isHexColor('red')).toBe(false)
    expect(isHexColor('#12345')).toBe(false)
    expect(isHexColor('url(javascript:alert(1))')).toBe(false)
    expect(isHexColor(undefined)).toBe(false)
  })
})

describe('degraus em palavras', () => {
  it('um valor que não bate com nenhum degrau aparece no mais próximo', () => {
    expect(nearestLevel(FILL_LEVELS, 0.2).label).toBe('Suave') // Propriedades: 0,2
    expect(nearestLevel(FILL_LEVELS, 0).label).toBe('Só contorno')
    expect(nearestLevel(FILL_LEVELS, 1).label).toBe('Cheio')
    expect(nearestLevel(LINE_WEIGHTS, 1.5).label).toBe('Fina')
    expect(nearestLevel(LINE_WEIGHTS, 3.5).label).toBe('Grossa')
    expect(nearestLevel(LINE_WEIGHTS, 3).label).toBe('Média') // no meio do caminho, fica o degrau de baixo
    expect(nearestLevel(POINT_SIZES, 8).label).toBe('Médio') // Nascentes: 8
  })
})

describe('uma cor só: a tela deriva o resto', () => {
  it('o contorno é a mesma cor, um tom mais escuro', () => {
    expect(deriveOutline('#c8431a')).toBe('#822c11')
    expect(deriveOutline('#fff')).toBe('#a6a6a6')
    expect(deriveOutline('#000000')).toBe('#000000')
  })

  it('a cor principal é a que a pessoa vê: miolo (polígono, ponto), linha, ícone', () => {
    expect(mainColor(readStyle(propriedades))).toBe('#32a852')
    expect(mainColor(readStyle(nascentes))).toBe('#0ea5e9')
    expect(mainColor(readStyle(estradas))).toBe('#fef3c7')
    expect(mainColor(readStyle(acoes))).toBe('#64748b')
  })

  it('polígono: muda o preenchimento e escurece o contorno junto', () => {
    const s = withMainColor(readStyle(propriedades), '#2a7da6')
    expect(s.fillColor).toBe('#2a7da6')
    expect(s.color).toBe(deriveOutline('#2a7da6'))
  })

  it('ponto com borda própria mantém a borda (a branca das nascentes); sem borda própria, a borda segue o miolo', () => {
    expect(withMainColor(readStyle(nascentes), '#2e7d5b')).toMatchObject({ fillColor: '#2e7d5b', color: '#ffffff' })
    const sem = readStyle({ baseStyle: { type: 'circle', color: '#111111' } })
    expect(withMainColor(sem, '#2e7d5b')).toMatchObject({ fillColor: '#2e7d5b', color: '#2e7d5b' })
  })

  it('linha e ícone: só a cor', () => {
    expect(withMainColor(readStyle(estradas), '#2a7da6').color).toBe('#2a7da6')
    expect(withMainColor(readStyle(acoes), '#2a7da6').color).toBe('#2a7da6')
  })

  it('o que a tela deriva grava e lê de volta igual', () => {
    const style = withMainColor(readStyle(propriedades), '#2a7da6')
    expect(readStyle(applyStyle(propriedades, style))).toEqual(style)
  })
})

describe('ícone por área (regra por valor)', () => {
  it('lê o ícone de cada área como o mapa lê: igual, ou sem diferenciar maiúsculas e espaços', () => {
    expect(ruleIcon(acoes, 'Vegetação')).toBe('sprout')
    expect(ruleIcon(acoes, ' vegetação ')).toBe('sprout')
    expect(ruleIcon(acoes, 'Fauna')).toBeUndefined() // sem regra para esse eixo
    expect(ruleIcon(estradas, 'x')).toBeUndefined()
    expect(hasIconRule(acoes)).toBe(true)
    expect(hasIconRule(propriedades)).toBe(false)
  })

  it('readEdit traz todos os ícones por área; camada sem regra não traz', () => {
    expect(readEdit({ name: 'Ações', visualConfig: acoes }).ruleIcons).toEqual({ Vegetação: 'sprout', Monitoramento: 'activity', 'Recursos Hídricos': 'droplets' })
    expect(readEdit({ name: 'Estradas', visualConfig: estradas }).ruleIcons).toBeUndefined()
  })

  it('troca o ícone de uma área e deixa as outras, a cor e as regras como estavam', () => {
    const edit = { ...readEdit({ name: 'Ações', visualConfig: acoes }), ruleIcons: { Vegetação: 'trees' } }
    const out = applyEdit(acoes, edit)
    expect(out.rules[0].values).toEqual({ Vegetação: 'trees', Monitoramento: 'activity', 'Recursos Hídricos': 'droplets' })
    expect(out.rules[0].field).toBe('eixo_tematico')
    expect(out.baseStyle.color).toBe('#64748b')
    expect(acoes.rules[0].values.Vegetação).toBe('sprout') // o original não muda
  })

  it('uma área sem regra ganha uma chave nova; a que existe com outra caixa é trocada, sem duplicar', () => {
    const novo = applyEdit(acoes, { ...readEdit({ name: 'Ações', visualConfig: acoes }), ruleIcons: { Fauna: 'paw-print' } })
    expect(novo.rules[0].values.Fauna).toBe('paw-print')
    const caixa = applyEdit(acoes, { ...readEdit({ name: 'Ações', visualConfig: acoes }), ruleIcons: { 'vegetação': 'trees' } })
    expect(Object.keys(caixa.rules[0].values)).toHaveLength(3)
    expect(caixa.rules[0].values.Vegetação).toBe('trees')
  })

  it('o que o mapa lê depois de gravar é o ícone novo (ida e volta)', () => {
    const out = applyEdit(acoes, { ...readEdit({ name: 'Ações', visualConfig: acoes }), ruleIcons: { Vegetação: 'trees' } })
    expect(ruleIcon(out, 'Vegetação')).toBe('trees')
  })

  it('camada sem regra ignora ruleIcons', () => {
    const out = applyEdit(estradas, { ...readEdit({ name: 'Estradas', visualConfig: estradas }), ruleIcons: { x: 'trees' } })
    expect(out.rules).toBeUndefined()
  })
})
