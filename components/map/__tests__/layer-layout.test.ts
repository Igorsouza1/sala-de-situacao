import {
  createFolder,
  defaultLayout,
  deleteFolder,
  effectiveOpacity,
  flattenLayout,
  folderOpacityOf,
  layerStyleOf,
  moveFolder,
  moveLayer,
  nextFolderName,
  parseLayout,
  reconcileLayout,
  renameFolder,
  restoreFolder,
  setFolderOpacity,
  setLayerStyle,
  stackFromLayout,
  stepFolder,
  stepLayer,
  planFolderToggle,
  type CatalogLayer,
  type MapLayout,
} from '../helpers/layer-layout'

// De cima para baixo: o que a lista mostra e o que está por cima no mapa.
const L = (slug: string, extra: Partial<CatalogLayer> = {}): CatalogLayer => ({ slug, ...extra })

// Um catálogo parecido com o da região 1: as categorias aparecem misturadas na ordem do catálogo (de baixo para cima).
const catalog: CatalogLayer[] = [
  L('bacia', { category: 'Base Territorial' }),
  L('propriedades', { category: 'Base Territorial' }),
  L('desmatamento', { category: 'Monitoramento' }),
  L('estradas', { category: 'Infraestrutura' }),
  L('deque', { category: 'Monitoramento' }),
  L('acoes', { category: 'Operacional' }),
  L('fogo', { category: 'Uploads', under: true, imported: true }),
  L('apps', { category: 'Uploads' }),
]

const folderOf = (layout: MapLayout, id: string) => {
  const f = layout.items.find((i) => i.kind === 'folder' && i.id === id)
  if (!f || f.kind !== 'folder') throw new Error(`sem a pasta ${id}`)
  return f
}
const rootKinds = (layout: MapLayout) => layout.items.map((i) => (i.kind === 'folder' ? `[${i.id}]` : i.slug))

describe('defaultLayout', () => {
  it('abre com uma pasta por categoria, na ordem Operacional, Monitoramento, Base, Infraestrutura, Uploads', () => {
    const layout = defaultLayout(catalog)
    expect(layout.items.map((i) => (i.kind === 'folder' ? i.name : i.slug))).toEqual([
      'Operacional',
      'Monitoramento',
      'Base Territorial',
      'Infraestrutura',
      'Uploads',
    ])
  })

  it('dentro da pasta mantém o empilhamento do catálogo: a última do catálogo fica por cima', () => {
    const layout = defaultLayout(catalog)
    expect(folderOf(layout, 'cat:Base Territorial').layers.map((l) => l.slug)).toEqual(['propriedades', 'bacia'])
    expect(folderOf(layout, 'cat:Monitoramento').layers.map((l) => l.slug)).toEqual(['deque', 'desmatamento'])
  })

  it('o raster importado fica no fundo da sua pasta', () => {
    expect(folderOf(defaultLayout(catalog), 'cat:Uploads').layers.map((l) => l.slug)).toEqual(['apps', 'fogo'])
  })

  it('camada sem categoria vai para a pasta "Outros"; sem camadas não há pastas', () => {
    const layout = defaultLayout([L('x')])
    expect(layout.items.map((i) => (i.kind === 'folder' ? i.name : i.slug))).toEqual(['Outros'])
    expect(defaultLayout([]).items).toEqual([])
  })

  it('as pastas nascem abertas', () => {
    expect(defaultLayout(catalog).items.every((i) => i.kind === 'folder' && i.open)).toBe(true)
  })
})

describe('flattenLayout e stackFromLayout', () => {
  it('a lista de cima para baixo, e a pilha do mapa é o inverso', () => {
    const layout = defaultLayout(catalog)
    expect(flattenLayout(layout)).toEqual(['acoes', 'deque', 'desmatamento', 'propriedades', 'bacia', 'estradas', 'apps', 'fogo'])
    expect(stackFromLayout(layout)).toEqual(['fogo', 'apps', 'estradas', 'bacia', 'propriedades', 'desmatamento', 'deque', 'acoes'])
  })

  it('camada solta entra na conta na sua posição', () => {
    const layout: MapLayout = {
      v: 1,
      items: [
        { kind: 'layer', slug: 'a' },
        { kind: 'folder', id: 'f', name: 'F', open: true, layers: [{ slug: 'b' }, { slug: 'c' }] },
        { kind: 'layer', slug: 'd' },
      ],
    }
    expect(flattenLayout(layout)).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('reconcileLayout', () => {
  it('sem nada salvo é o padrão', () => {
    expect(reconcileLayout(undefined, catalog)).toEqual(defaultLayout(catalog))
  })

  it('esquece o que saiu do catálogo e ignora repetidas, sem tirar nada do lugar', () => {
    const saved: MapLayout = {
      v: 1,
      items: [
        { kind: 'layer', slug: 'sumiu' },
        { kind: 'folder', id: 'f', name: 'F', open: true, layers: [{ slug: 'bacia' }, { slug: 'estradas' }] },
        { kind: 'layer', slug: 'bacia' },
      ],
    }
    const out = reconcileLayout(saved, [L('bacia', { category: 'Base Territorial' }), L('estradas', { category: 'Infraestrutura' })])
    expect(rootKinds(out)).toEqual(['[f]'])
    expect(folderOf(out, 'f').layers.map((l) => l.slug)).toEqual(['bacia', 'estradas'])
  })

  it('camada nova do catálogo vai para o fim da pasta da sua categoria, se a pessoa ainda a tem', () => {
    const saved = defaultLayout(catalog)
    const out = reconcileLayout(saved, [...catalog, L('nascentes', { category: 'Base Territorial' })])
    expect(folderOf(out, 'cat:Base Territorial').layers.map((l) => l.slug)).toEqual(['propriedades', 'bacia', 'nascentes'])
  })

  it('sem a pasta da categoria (apagada), a camada nova cai solta no topo', () => {
    const saved = deleteFolder(defaultLayout(catalog), 'cat:Base Territorial')
    const out = reconcileLayout(saved, [...catalog, L('nascentes', { category: 'Base Territorial' })])
    expect(out.items[0]).toEqual({ kind: 'layer', slug: 'nascentes' })
  })

  it('importada por arrastar: vetor cai solto no topo, raster cai solto no fim', () => {
    const saved = defaultLayout(catalog)
    const out = reconcileLayout(saved, [
      ...catalog,
      L('traçado', { category: 'Uploads', imported: true }),
      L('mancha', { category: 'Uploads', imported: true, under: true }),
    ])
    expect(out.items[0]).toEqual({ kind: 'layer', slug: 'traçado' })
    expect(out.items[out.items.length - 1]).toEqual({ kind: 'layer', slug: 'mancha' })
  })

  it('não mexe no que já estava arrumado', () => {
    const saved = moveLayer(defaultLayout(catalog), 'estradas', { folderId: null, index: 0 })
    const out = reconcileLayout(saved, catalog)
    expect(out).toEqual(saved)
  })
})

describe('moveLayer', () => {
  it('muda a posição dentro da pasta', () => {
    const out = moveLayer(defaultLayout(catalog), 'bacia', { folderId: 'cat:Base Territorial', index: 0 })
    expect(folderOf(out, 'cat:Base Territorial').layers.map((l) => l.slug)).toEqual(['bacia', 'propriedades'])
  })

  it('leva a camada de uma pasta para outra', () => {
    const out = moveLayer(defaultLayout(catalog), 'estradas', { folderId: 'cat:Monitoramento', index: 1 })
    expect(folderOf(out, 'cat:Monitoramento').layers.map((l) => l.slug)).toEqual(['deque', 'estradas', 'desmatamento'])
    expect(folderOf(out, 'cat:Infraestrutura').layers).toEqual([])
  })

  it('tira a camada da pasta e a deixa solta', () => {
    const out = moveLayer(defaultLayout(catalog), 'estradas', { folderId: null, index: 0 })
    expect(out.items[0]).toEqual({ kind: 'layer', slug: 'estradas' })
  })

  it('leva junto a cor e a opacidade que a pessoa escolheu', () => {
    const styled = setLayerStyle(defaultLayout(catalog), 'estradas', { color: '#ff0000', opacity: 0.5 })
    const out = moveLayer(styled, 'estradas', { folderId: null, index: 0 })
    expect(out.items[0]).toEqual({ kind: 'layer', slug: 'estradas', color: '#ff0000', opacity: 0.5 })
  })

  it('a posição é a de depois de tirar a camada (arrastar para baixo na mesma lista)', () => {
    const layout: MapLayout = { v: 1, items: ['a', 'b', 'c', 'd'].map((slug) => ({ kind: 'layer' as const, slug })) }
    expect(rootKinds(moveLayer(layout, 'a', { folderId: null, index: 2 }))).toEqual(['b', 'c', 'a', 'd'])
  })

  it('camada ou pasta que não existe: nada muda', () => {
    const layout = defaultLayout(catalog)
    expect(moveLayer(layout, 'nao-existe', { folderId: null, index: 0 })).toBe(layout)
    expect(moveLayer(layout, 'bacia', { folderId: 'nao-existe', index: 0 })).toBe(layout)
  })

  it('o índice fora dos limites é apertado para dentro', () => {
    const out = moveLayer(defaultLayout(catalog), 'bacia', { folderId: 'cat:Base Territorial', index: 99 })
    expect(folderOf(out, 'cat:Base Territorial').layers.map((l) => l.slug)).toEqual(['propriedades', 'bacia'])
  })
})

describe('moveFolder', () => {
  it('muda a pasta de lugar na pilha, levando as camadas dela', () => {
    const out = moveFolder(defaultLayout(catalog), 'cat:Infraestrutura', 0)
    expect(rootKinds(out)).toEqual(['[cat:Infraestrutura]', '[cat:Operacional]', '[cat:Monitoramento]', '[cat:Base Territorial]', '[cat:Uploads]'])
    expect(stackFromLayout(out).slice(-1)).toEqual(['estradas'])
  })
})

describe('createFolder, renameFolder e deleteFolder', () => {
  it('cria a pasta no topo, com as camadas pedidas na ordem em que estavam', () => {
    const out = createFolder(defaultLayout(catalog), 'nova', 'Minha pasta', ['bacia', 'deque'])
    expect(out.items[0]).toMatchObject({ kind: 'folder', id: 'nova', name: 'Minha pasta', open: true })
    expect(folderOf(out, 'nova').layers.map((l) => l.slug)).toEqual(['deque', 'bacia'])
    expect(folderOf(out, 'cat:Base Territorial').layers.map((l) => l.slug)).toEqual(['propriedades'])
  })

  it('o nome é aparado e limitado, e nome vazio vira "Nova pasta"', () => {
    expect(folderOf(createFolder(defaultLayout(catalog), 'n', '   '), 'n').name).toBe('Nova pasta')
    expect(folderOf(createFolder(defaultLayout(catalog), 'n', 'x'.repeat(200)), 'n').name).toHaveLength(60)
  })

  it('id repetido não cria uma segunda pasta', () => {
    const layout = defaultLayout(catalog)
    expect(createFolder(layout, 'cat:Operacional', 'Outra')).toBe(layout)
  })

  it('renomeia; nome vazio não renomeia', () => {
    const layout = defaultLayout(catalog)
    expect(folderOf(renameFolder(layout, 'cat:Operacional', '  Campo  '), 'cat:Operacional').name).toBe('Campo')
    expect(renameFolder(layout, 'cat:Operacional', '   ')).toBe(layout)
  })

  it('apagar a pasta faz as camadas subirem, no lugar dela e na mesma ordem; nada se perde', () => {
    const layout = defaultLayout(catalog)
    const out = deleteFolder(layout, 'cat:Base Territorial')
    expect(rootKinds(out)).toEqual(['[cat:Operacional]', '[cat:Monitoramento]', 'propriedades', 'bacia', '[cat:Infraestrutura]', '[cat:Uploads]'])
    expect(flattenLayout(out)).toEqual(flattenLayout(layout))
  })

  it('a camada solta guarda a cor e a opacidade ao subir', () => {
    const styled = setLayerStyle(defaultLayout(catalog), 'bacia', { opacity: 0.4 })
    const out = deleteFolder(styled, 'cat:Base Territorial')
    expect(out.items).toContainEqual({ kind: 'layer', slug: 'bacia', opacity: 0.4 })
  })
})

describe('cor e opacidade', () => {
  it('guarda a cor e a opacidade da camada, dentro ou fora de pasta', () => {
    const out = setLayerStyle(defaultLayout(catalog), 'bacia', { color: '#00ff00', opacity: 0.5 })
    expect(folderOf(out, 'cat:Base Territorial').layers.find((l) => l.slug === 'bacia')).toEqual({ slug: 'bacia', color: '#00ff00', opacity: 0.5 })
  })

  it('null volta ao original e opacidade cheia não é guardada', () => {
    const styled = setLayerStyle(defaultLayout(catalog), 'bacia', { color: '#00ff00', opacity: 0.5 })
    const out = setLayerStyle(styled, 'bacia', { color: null, opacity: 1 })
    expect(folderOf(out, 'cat:Base Territorial').layers.find((l) => l.slug === 'bacia')).toEqual({ slug: 'bacia' })
  })

  it('cor que não é hexadecimal e opacidade fora do limite são recusadas ou apertadas', () => {
    const layout = defaultLayout(catalog)
    expect(setLayerStyle(layout, 'bacia', { color: 'vermelho' })).toBe(layout)
    const out = setLayerStyle(layout, 'bacia', { opacity: -3 })
    expect(folderOf(out, 'cat:Base Territorial').layers.find((l) => l.slug === 'bacia')?.opacity).toBe(0.05)
  })

  it('a opacidade da pasta multiplica a da camada', () => {
    let layout = setLayerStyle(defaultLayout(catalog), 'bacia', { opacity: 0.5 })
    layout = setFolderOpacity(layout, 'cat:Base Territorial', 0.5)
    expect(effectiveOpacity(layout, 'bacia')).toBeCloseTo(0.25)
    expect(effectiveOpacity(layout, 'propriedades')).toBeCloseTo(0.5)
    expect(effectiveOpacity(layout, 'estradas')).toBe(1)
    expect(effectiveOpacity(layout, 'nao-existe')).toBe(1)
  })
})

describe('planFolderToggle', () => {
  const layout = defaultLayout(catalog)
  const base = 'cat:Base Territorial'
  const isOnIn = (...on: string[]) => (slug: string) => on.includes(slug)

  it('com alguma ligada, desliga as ligadas e lembra quais eram', () => {
    const out = planFolderToggle(layout, base, isOnIn('bacia', 'estradas'))
    expect(out.off).toEqual(['bacia'])
    expect(out.on).toEqual([])
    expect(folderOf(out.layout, base).remembered).toEqual(['bacia'])
  })

  it('sem nenhuma ligada, religa só as que estavam ligadas antes', () => {
    const off = planFolderToggle(layout, base, isOnIn('bacia', 'estradas'))
    const on = planFolderToggle(off.layout, base, isOnIn('estradas'))
    expect(on.on).toEqual(['bacia'])
    expect(on.off).toEqual([])
    expect(folderOf(on.layout, base).remembered).toBeUndefined()
  })

  it('sem nada lembrado, liga todas', () => {
    expect(planFolderToggle(layout, base, isOnIn()).on.sort()).toEqual(['bacia', 'propriedades'])
  })

  it('o que foi lembrado e saiu da pasta não volta', () => {
    const off = planFolderToggle(layout, base, isOnIn('bacia', 'propriedades'))
    const moved = moveLayer(off.layout, 'bacia', { folderId: null, index: 0 })
    expect(planFolderToggle(moved, base, isOnIn()).on).toEqual(['propriedades'])
  })

  it('a decisão de "ligada" é de quem chama (camada com grupos, por exemplo)', () => {
    const out = planFolderToggle(layout, 'cat:Operacional', (slug) => slug === 'acoes')
    expect(out.off).toEqual(['acoes'])
  })

  it('pasta vazia ou que não existe não muda nada', () => {
    const empty = moveLayer(moveLayer(layout, 'bacia', { folderId: null, index: 0 }), 'propriedades', { folderId: null, index: 0 })
    expect(planFolderToggle(empty, base, isOnIn('estradas'))).toEqual({ layout: empty, on: [], off: [] })
    expect(planFolderToggle(layout, 'nao-existe', isOnIn())).toEqual({ layout, on: [], off: [] })
  })
})

describe('parseLayout', () => {
  it('lê o que foi guardado', () => {
    const layout = setLayerStyle(defaultLayout(catalog), 'bacia', { color: '#112233', opacity: 0.6 })
    expect(parseLayout(JSON.parse(JSON.stringify(layout)))).toEqual(layout)
  })

  it('valor estranho vira "não salvo", nunca um erro', () => {
    expect(parseLayout(null)).toBeUndefined()
    expect(parseLayout('x')).toBeUndefined()
    expect(parseLayout({ v: 2, items: [] })).toBeUndefined()
    expect(parseLayout({ v: 1, items: 'x' })).toBeUndefined()
  })

  it('descarta item inválido, cor inválida, camada repetida e pasta dentro de pasta', () => {
    const out = parseLayout({
      v: 1,
      items: [
        { kind: 'layer', slug: 'a', color: 'azul', opacity: 7 },
        { kind: 'layer', slug: 'a' },
        { kind: 'banana' },
        { kind: 'folder', id: 'f', name: 'F', open: true, layers: [{ slug: 'b' }, { kind: 'folder', id: 'g', name: 'G', layers: [] }, { slug: 5 }] },
        { kind: 'folder', id: 'f', name: 'Repetida', open: true, layers: [] },
      ],
    })
    expect(out?.items).toEqual([
      { kind: 'layer', slug: 'a' },
      { kind: 'folder', id: 'f', name: 'F', open: true, layers: [{ slug: 'b' }] },
    ])
  })
})

describe('stepLayer e stepFolder (teclado)', () => {
  const mixed: MapLayout = {
    v: 1,
    items: [
      { kind: 'layer', slug: 'x' },
      { kind: 'folder', id: 'F', name: 'F', open: true, layers: [{ slug: 'a' }, { slug: 'b' }] },
      { kind: 'folder', id: 'C', name: 'C', open: false, layers: [{ slug: 'c' }] },
      { kind: 'layer', slug: 'y' },
    ],
  }

  it('dentro da pasta anda uma posição', () => {
    expect(folderOf(stepLayer(mixed, 'a', 1), 'F').layers.map((l) => l.slug)).toEqual(['b', 'a'])
    expect(folderOf(stepLayer(mixed, 'b', -1), 'F').layers.map((l) => l.slug)).toEqual(['b', 'a'])
  })

  it('na ponta da pasta, sai dela: para cima antes da pasta, para baixo depois', () => {
    expect(rootKinds(stepLayer(mixed, 'a', -1))).toEqual(['x', 'a', '[F]', '[C]', 'y'])
    expect(rootKinds(stepLayer(mixed, 'b', 1))).toEqual(['x', '[F]', 'b', '[C]', 'y'])
  })

  it('solta, entra numa pasta ABERTA: descendo pelo começo, subindo pelo fim', () => {
    const down = stepLayer(mixed, 'x', 1)
    expect(folderOf(down, 'F').layers.map((l) => l.slug)).toEqual(['x', 'a', 'b'])
    const up = stepLayer({ ...mixed, items: [mixed.items[1], { kind: 'layer', slug: 'x' }] }, 'x', -1)
    expect(folderOf(up, 'F').layers.map((l) => l.slug)).toEqual(['a', 'b', 'x'])
  })

  it('solta, passa por cima de uma pasta FECHADA sem entrar', () => {
    expect(rootKinds(stepLayer(mixed, 'y', -1))).toEqual(['x', '[F]', 'y', '[C]'])
  })

  it('na ponta da pilha ou camada que não existe: nada muda', () => {
    expect(stepLayer(mixed, 'x', -1)).toBe(mixed)
    expect(stepLayer(mixed, 'y', 1)).toBe(mixed)
    expect(stepLayer(mixed, 'nao-existe', 1)).toBe(mixed)
  })

  it('a pasta anda como um bloco e para na ponta', () => {
    expect(rootKinds(stepFolder(mixed, 'F', 1))).toEqual(['x', '[C]', '[F]', 'y'])
    expect(rootKinds(stepFolder(mixed, 'F', -1))).toEqual(['[F]', 'x', '[C]', 'y'])
    expect(stepFolder(mixed, 'C', 1)).not.toBe(mixed)
    expect(stepFolder({ v: 1, items: [mixed.items[1]] }, 'F', 1).items).toHaveLength(1)
  })
})

describe('nextFolderName', () => {
  it('"Nova pasta", e "Nova pasta 2", "Nova pasta 3" quando já existem', () => {
    let layout = defaultLayout(catalog)
    expect(nextFolderName(layout)).toBe('Nova pasta')
    layout = createFolder(layout, 'a', nextFolderName(layout))
    expect(nextFolderName(layout)).toBe('Nova pasta 2')
    layout = createFolder(layout, 'b', nextFolderName(layout))
    expect(nextFolderName(layout)).toBe('Nova pasta 3')
  })
})

describe('restoreFolder (desfazer ao apagar a pasta)', () => {
  it('a pasta volta ao lugar e as camadas dela voltam para dentro, na ordem', () => {
    const before = defaultLayout(catalog)
    const folder = folderOf(before, 'cat:Base Territorial')
    const at = before.items.indexOf(folder)
    const after = deleteFolder(before, 'cat:Base Territorial')
    expect(restoreFolder(after, folder, at)).toEqual(before)
  })

  it('traz de volta as camadas mesmo que a pessoa as tenha movido depois de apagar', () => {
    const before = defaultLayout(catalog)
    const folder = folderOf(before, 'cat:Base Territorial')
    const after = moveLayer(deleteFolder(before, 'cat:Base Territorial'), 'bacia', { folderId: 'cat:Operacional', index: 0 })
    const out = restoreFolder(after, folder, 2)
    expect(folderOf(out, 'cat:Base Territorial').layers.map((l) => l.slug)).toEqual(['propriedades', 'bacia'])
    expect(folderOf(out, 'cat:Operacional').layers.map((l) => l.slug)).toEqual(['acoes'])
  })

  it('camada que saiu do catálogo entretanto não volta; pasta com o mesmo id não duplica', () => {
    const before = defaultLayout(catalog)
    const folder = folderOf(before, 'cat:Base Territorial')
    const after = deleteFolder(before, 'cat:Base Territorial')
    const trimmed = reconcileLayout(after, catalog.filter((l) => l.slug !== 'bacia'))
    expect(folderOf(restoreFolder(trimmed, folder, 2), 'cat:Base Territorial').layers.map((l) => l.slug)).toEqual(['propriedades'])
    expect(restoreFolder(before, folder, 0)).toBe(before)
  })
})

describe('layerStyleOf e folderOpacityOf', () => {
  it('devolve só o que a pessoa escolheu, dentro ou fora de pasta', () => {
    let layout = setLayerStyle(defaultLayout(catalog), 'bacia', { color: '#112233', opacity: 0.5 })
    layout = moveLayer(layout, 'estradas', { folderId: null, index: 0 })
    layout = setLayerStyle(layout, 'estradas', { opacity: 0.3 })
    expect(layerStyleOf(layout, 'bacia')).toEqual({ color: '#112233', opacity: 0.5 })
    expect(layerStyleOf(layout, 'estradas')).toEqual({ opacity: 0.3 })
    expect(layerStyleOf(layout, 'propriedades')).toEqual({})
    expect(layerStyleOf(layout, 'nao-existe')).toEqual({})
  })

  it('a opacidade da pasta, quando há', () => {
    const layout = setFolderOpacity(defaultLayout(catalog), 'cat:Operacional', 0.4)
    expect(folderOpacityOf(layout, 'cat:Operacional')).toBe(0.4)
    expect(folderOpacityOf(layout, 'cat:Monitoramento')).toBeUndefined()
    expect(folderOpacityOf(layout, 'nao-existe')).toBeUndefined()
  })
})
