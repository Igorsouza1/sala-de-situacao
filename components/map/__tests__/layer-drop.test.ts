import type { MapLayout } from '../helpers/layer-layout'
import { flattenLayout } from '../helpers/layer-layout'
import { applyDrop, resolveDrop, visibleRows, INDENT, type DropRow } from '../helpers/layer-drop'

// Um layout com os casos que importam:  [loose1]  [F: a b]  [G: c]  [loose2]   (G aberta; F e G de acordo com o teste)
const layout: MapLayout = {
  v: 1,
  items: [
    { kind: 'layer', slug: 'loose1' },
    { kind: 'folder', id: 'F', name: 'F', open: true, layers: [{ slug: 'a' }, { slug: 'b' }] },
    { kind: 'folder', id: 'G', name: 'G', open: true, layers: [{ slug: 'c' }] },
    { kind: 'layer', slug: 'loose2' },
  ],
}
const empty: MapLayout = { v: 1, items: [{ kind: 'folder', id: 'E', name: 'E', open: true, layers: [] }, { kind: 'layer', slug: 'x' }] }

const H = 48
const GAP = 16
const LEFT = 20

/** Dá uma geometria às linhas: 48 px cada, 16 px entre os blocos (cada pasta é um cartão; as soltas seguidas são um cartão só). */
function withGeometry(rows: ReturnType<typeof visibleRows>): DropRow[] {
  let y = 0
  let prevBlock: string | null = null
  return rows.map((row) => {
    const block = row.folderId ?? 'loose'
    if (prevBlock !== null && block !== prevBlock) y += GAP
    prevBlock = block
    const rect = { top: y, bottom: y + H, left: LEFT }
    y += H
    return { ...row, ...rect }
  })
}
const rowsOf = (l: MapLayout) => withGeometry(visibleRows(l))
const mid = (r: DropRow) => (r.top + r.bottom) / 2
const find = (rows: DropRow[], key: string) => rows.find((r) => r.key === key)!

describe('visibleRows', () => {
  it('uma linha por cabeçalho de pasta, camada e faixa de pasta vazia; pasta fechada esconde as camadas', () => {
    expect(visibleRows(layout).map((r) => r.key)).toEqual(['layer:loose1', 'folder:F', 'layer:a', 'layer:b', 'folder:G', 'layer:c', 'layer:loose2'])
    const closed: MapLayout = { v: 1, items: [{ kind: 'folder', id: 'F', name: 'F', open: false, layers: [{ slug: 'a' }] }] }
    expect(visibleRows(closed).map((r) => r.key)).toEqual(['folder:F'])
    expect(visibleRows(empty).map((r) => r.key)).toEqual(['folder:E', 'empty:E', 'layer:x'])
  })

  it('cada linha sabe a posição de raiz do seu bloco e a da camada dentro da pasta', () => {
    const rows = visibleRows(layout)
    expect(rows.map((r) => r.rootIndex)).toEqual([0, 1, 1, 1, 2, 2, 3])
    expect(rows.filter((r) => r.kind === 'layer').map((r) => r.indexInFolder)).toEqual([undefined, 0, 1, 0, undefined])
  })
})

describe('resolveDrop — arrastando uma camada', () => {
  const rows = rowsOf(layout)
  const drag = { type: 'layer' as const, slug: 'loose2' }
  const at = (key: string, where: 'upper' | 'lower', x = LEFT + 5) => {
    const r = find(rows, key)
    return { x, y: where === 'upper' ? r.top + 5 : r.bottom - 5 }
  }

  it('entre duas camadas da mesma pasta cai dentro dela, na posição do vão', () => {
    const r = resolveDrop(rows, drag, at('layer:b', 'upper'))!
    expect(r.target).toEqual({ kind: 'layer', slug: 'loose2', to: { folderId: 'F', index: 1 } })
    expect(r.folderId).toBe('F')
    expect(r.line).toEqual({ y: find(rows, 'layer:a').bottom, inset: true })
  })

  it('logo abaixo do cabeçalho de uma pasta aberta é o começo dela', () => {
    const r = resolveDrop(rows, drag, at('folder:F', 'lower'))!
    expect(r.target).toMatchObject({ to: { folderId: 'F', index: 0 } })
  })

  it('acima do cabeçalho de uma pasta é antes dela, solta, na pilha', () => {
    const r = resolveDrop(rows, drag, at('folder:G', 'upper', LEFT + 2))!
    // o vão fica entre b (fim de F) e G: pelo recuo, fora de F; antes de G, na raiz
    expect(r.target).toEqual({ kind: 'layer', slug: 'loose2', to: { folderId: null, index: 2 } })
    expect(r.folderId).toBeNull()
  })

  it('no fim de uma pasta, o recuo do ponteiro decide: mais para dentro, fica nela; mais para fora, sai dela', () => {
    const inside = resolveDrop(rows, drag, at('layer:b', 'lower', LEFT + INDENT + 4))!
    expect(inside.target).toMatchObject({ to: { folderId: 'F', index: 2 } })
    const outside = resolveDrop(rows, drag, at('layer:b', 'lower', LEFT + 2))!
    expect(outside.target).toMatchObject({ to: { folderId: null, index: 2 } })
  })

  it('o índice é o de DEPOIS de tirar a camada de onde estava', () => {
    // loose1 (raiz 0) arrastada para depois de F (raiz 1): sai da frente, então F vira a posição 0 e o vão é a 1
    const r = resolveDrop(rows, { type: 'layer', slug: 'loose1' }, at('layer:b', 'lower', LEFT + 2))!
    expect(r.target).toMatchObject({ to: { folderId: null, index: 1 } })
    // a de dentro de F para outro lugar da mesma pasta
    const same = resolveDrop(rows, { type: 'layer', slug: 'a' }, at('layer:b', 'lower', LEFT + INDENT + 4))!
    expect(same.target).toMatchObject({ to: { folderId: 'F', index: 1 } })
  })

  it('soltar onde ela já está não faz nada', () => {
    const r = resolveDrop(rows, { type: 'layer', slug: 'a' }, at('layer:a', 'upper'))!
    expect(r.noop).toBe(true)
    expect(applyDrop(layout, r.target)).toBe(layout)
  })

  it('sobre o meio de uma pasta FECHADA, entra nela, no fim', () => {
    const closed: MapLayout = {
      v: 1,
      items: [{ kind: 'layer', slug: 'z' }, { kind: 'folder', id: 'F', name: 'F', open: false, layers: [{ slug: 'a' }, { slug: 'b' }] }],
    }
    const r2 = rowsOf(closed)
    const header = find(r2, 'folder:F')
    const r = resolveDrop(r2, { type: 'layer', slug: 'z' }, { x: LEFT + 5, y: mid(header) })!
    expect(r.target).toEqual({ kind: 'layer', slug: 'z', to: { folderId: 'F', index: 2 } })
    expect(r.line).toBeNull()
    expect(r.folderId).toBe('F')
  })

  it('pasta aberta e vazia: a faixa dela recebe a camada', () => {
    const r2 = rowsOf(empty)
    const strip = find(r2, 'empty:E')
    const r = resolveDrop(r2, { type: 'layer', slug: 'x' }, { x: LEFT + 5, y: mid(strip) })!
    expect(r.target).toMatchObject({ to: { folderId: 'E', index: 0 } })
  })

  it('acima de tudo é o topo da pilha; abaixo de tudo é o fim', () => {
    expect(resolveDrop(rows, drag, { x: LEFT, y: -50 })!.target).toMatchObject({ to: { folderId: null, index: 0 } })
    const end = resolveDrop(rows, { type: 'layer', slug: 'loose1' }, { x: LEFT, y: 9999 })!
    // loose1 (raiz 0) vai para o fim: quatro itens na raiz, menos ela
    expect(end.target).toMatchObject({ to: { folderId: null, index: 3 } })
  })

  it('sem linhas, não há onde soltar', () => {
    expect(resolveDrop([], drag, { x: 0, y: 0 })).toBeNull()
  })
})

describe('resolveDrop — arrastando uma pasta', () => {
  const rows = rowsOf(layout)

  it('só cai entre blocos da raiz, nunca dentro de outra pasta', () => {
    // o ponteiro está sobre uma camada de F, mas a pasta G só pode ficar antes ou depois do bloco F inteiro
    const a = find(rows, 'layer:a')
    const r = resolveDrop(rows, { type: 'folder', id: 'G' }, { x: LEFT + 40, y: a.top + 2 })!
    expect(r.target).toEqual({ kind: 'folder', id: 'G', index: 1 })
    expect(r.folderId).toBeNull()
    expect(r.noop).toBe(false)
  })

  it('depois do bloco da pasta vizinha é onde ela já está: não faz nada', () => {
    const b = find(rows, 'layer:b')
    const r = resolveDrop(rows, { type: 'folder', id: 'G' }, { x: LEFT + 40, y: b.bottom - 2 })!
    expect(r.target).toEqual({ kind: 'folder', id: 'G', index: 2 })
    expect(r.noop).toBe(true)
  })

  it('leva a pasta para o topo e para o fim', () => {
    expect(resolveDrop(rows, { type: 'folder', id: 'G' }, { x: LEFT, y: -10 })!.target).toMatchObject({ index: 0 })
    expect(resolveDrop(rows, { type: 'folder', id: 'F' }, { x: LEFT, y: 9999 })!.target).toMatchObject({ index: 3 })
  })

  it('soltar no lugar dela não faz nada', () => {
    const f = find(rows, 'folder:F')
    const r = resolveDrop(rows, { type: 'folder', id: 'F' }, { x: LEFT, y: f.top + 2 })!
    expect(r.noop).toBe(true)
  })
})

describe('applyDrop', () => {
  it('leva a camada para dentro da pasta', () => {
    const rows = rowsOf(layout)
    const b = find(rows, 'layer:b')
    const r = resolveDrop(rows, { type: 'layer', slug: 'loose2' }, { x: LEFT + 5, y: b.top + 2 })!
    const out = applyDrop(layout, r.target)
    expect(flattenLayout(out)).toEqual(['loose1', 'a', 'loose2', 'b', 'c'])
  })

  it('leva a pasta para o fim da pilha', () => {
    const rows = rowsOf(layout)
    const r = resolveDrop(rows, { type: 'folder', id: 'F' }, { x: LEFT, y: 9999 })!
    expect(flattenLayout(applyDrop(layout, r.target))).toEqual(['loose1', 'c', 'loose2', 'a', 'b'])
  })
})
