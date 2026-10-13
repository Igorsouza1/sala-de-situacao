import { planStackMoves, sameOrder, stackIdsOf, stackOrder } from '../helpers/layer-order'

const layers = ['a', 'b', 'c', 'd'].map((slug) => ({ slug }))
const slugs = (list: { slug: string }[]) => list.map((l) => l.slug)

describe('stackOrder', () => {
  it('sem escolha, é a ordem do catálogo', () => {
    expect(slugs(stackOrder(layers, undefined))).toEqual(['a', 'b', 'c', 'd'])
    expect(slugs(stackOrder(layers, []))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('segue a ordem escolhida', () => {
    expect(slugs(stackOrder(layers, ['d', 'c', 'b', 'a']))).toEqual(['d', 'c', 'b', 'a'])
  })

  it('esquece camada que sumiu do catálogo e ignora repetidas', () => {
    expect(slugs(stackOrder(layers, ['x', 'c', 'c', 'a', 'b', 'd']))).toEqual(['c', 'a', 'b', 'd'])
  })

  it('camada nova entra logo depois da que vinha antes dela no catálogo', () => {
    // a pessoa ordenou c, a e b; "d" é nova e vinha depois de "c" no catálogo
    expect(slugs(stackOrder(layers, ['c', 'a', 'b']))).toEqual(['c', 'd', 'a', 'b'])
    // "c" é nova e vinha depois de "b"
    expect(slugs(stackOrder(layers, ['b', 'd', 'a']))).toEqual(['b', 'c', 'd', 'a'])
  })

  it('camada nova sem nenhuma anterior conhecida vai para o fundo', () => {
    expect(slugs(stackOrder(layers, ['d', 'c']))).toEqual(['a', 'b', 'd', 'c'])
  })

  it('no padrão, as do fundo (rasters importados) ficam embaixo, mesmo sendo as mais novas', () => {
    const all = [{ slug: 'a' }, { slug: 'b' }, { slug: 'fogo' }]
    expect(slugs(stackOrder(all, undefined, (l) => l.slug === 'fogo'))).toEqual(['fogo', 'a', 'b'])
  })

  it('a escolha da pessoa vale sobre o padrão do fundo', () => {
    const all = [{ slug: 'a' }, { slug: 'b' }, { slug: 'fogo' }]
    expect(slugs(stackOrder(all, ['a', 'fogo', 'b'], (l) => l.slug === 'fogo'))).toEqual(['a', 'fogo', 'b'])
  })
})

describe('planStackMoves', () => {
  const style = ['basemap', 'relevo', ...stackIdsOf('a').slice(1, 3), ...stackIdsOf('b').slice(1, 3), 'destaque', 'preview-fill']
  const present = (ids: string[]) => ids.filter((id) => style.includes(id))

  it('já na ordem: nada a mover', () => {
    expect(planStackMoves(style, ['a', 'b'])).toEqual([])
  })

  it('trocar a e b move tudo para logo abaixo do que estava acima das camadas de dados', () => {
    const moves = planStackMoves(style, ['b', 'a'])
    expect(moves.map((m) => m.id)).toEqual(present([...stackIdsOf('b'), ...stackIdsOf('a')]))
    expect(new Set(moves.map((m) => m.before))).toEqual(new Set(['destaque']))
  })

  it('aplicar os movimentos deixa a pilha na ordem pedida e o resto no lugar', () => {
    const stack = [...style]
    for (const m of planStackMoves(stack, ['b', 'a'])) {
      stack.splice(stack.indexOf(m.id), 1)
      stack.splice(m.before ? stack.indexOf(m.before) : stack.length, 0, m.id)
    }
    expect(stack).toEqual(['basemap', 'relevo', 'b-fill', 'b-outline', 'a-fill', 'a-outline', 'destaque', 'preview-fill'])
    expect(planStackMoves(stack, ['b', 'a'])).toEqual([])
  })

  it('sem nada acima, vai para o topo', () => {
    const stack = ['basemap', 'a-fill', 'b-fill']
    expect(planStackMoves(stack, ['b', 'a'])).toEqual([{ id: 'b-fill', before: undefined }, { id: 'a-fill', before: undefined }])
  })

  it('o raster salvo acompanha a sua camada', () => {
    const stack = ['basemap', 'a-fill', 'raster-fogo-layer', 'fogo-fill']
    const moves = planStackMoves(stack, ['fogo', 'a'])
    expect(moves.map((m) => m.id)).toEqual(['raster-fogo-layer', 'fogo-fill', 'a-fill'])
  })

  it('camada que ainda não está no mapa é ignorada', () => {
    expect(planStackMoves(['a-fill'], ['a', 'b'])).toEqual([])
  })
})

describe('sameOrder', () => {
  it('compara posição por posição', () => {
    expect(sameOrder(['a', 'b'], ['a', 'b'])).toBe(true)
    expect(sameOrder(['a', 'b'], ['b', 'a'])).toBe(false)
    expect(sameOrder(['a'], ['a', 'b'])).toBe(false)
  })
})
