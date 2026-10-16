import { MARGIN, MIN_H, MIN_W, clampRect, clearWindow, moveRect, readWindow, resizeRect, saveWindow, type Viewport, type WinRect } from '../helpers/window-rect'

const vp: Viewport = { w: 1280, h: 800 }
const win: WinRect = { x: 400, y: 200, w: 400, h: 500 }

const memory = () => {
  const data = new Map<string, string>()
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k), data }
}

describe('clampRect', () => {
  it('uma janela que já cabe fica como está', () => {
    expect(clampRect(win, vp)).toEqual(win)
  })

  it('nunca sai da tela, sempre com a folga', () => {
    expect(clampRect({ ...win, x: -500, y: -500 }, vp)).toMatchObject({ x: MARGIN, y: MARGIN })
    expect(clampRect({ ...win, x: 5000, y: 5000 }, vp)).toMatchObject({ x: vp.w - MARGIN - win.w, y: vp.h - MARGIN - win.h })
  })

  it('não fica menor que o mínimo nem maior que a tela', () => {
    expect(clampRect({ x: 50, y: 50, w: 10, h: 10 }, vp)).toMatchObject({ w: MIN_W, h: MIN_H })
    expect(clampRect({ x: 50, y: 50, w: 9000, h: 9000 }, vp)).toMatchObject({ w: vp.w - MARGIN * 2, h: vp.h - MARGIN * 2 })
  })

  it('numa tela que encolheu, a janela é recolocada inteira dentro dela', () => {
    const small = { w: 700, h: 500 }
    const out = clampRect({ x: 900, y: 600, w: 600, h: 600 }, small)
    expect(out.x + out.w).toBeLessThanOrEqual(small.w - MARGIN)
    expect(out.y + out.h).toBeLessThanOrEqual(small.h - MARGIN)
    expect(out.x).toBeGreaterThanOrEqual(MARGIN)
    expect(out.y).toBeGreaterThanOrEqual(MARGIN)
  })

  it('numa tela menor que o mínimo, o mínimo vence (a janela rola por dentro)', () => {
    expect(clampRect(win, { w: 200, h: 200 })).toMatchObject({ w: MIN_W, h: MIN_H })
  })
})

describe('moveRect', () => {
  it('anda sem mudar de tamanho', () => {
    expect(moveRect(win, 30, -20, vp)).toEqual({ ...win, x: 430, y: 180 })
  })

  it('para na borda da tela', () => {
    expect(moveRect(win, -9999, -9999, vp)).toMatchObject({ x: MARGIN, y: MARGIN, w: win.w, h: win.h })
    expect(moveRect(win, 9999, 9999, vp)).toMatchObject({ x: vp.w - MARGIN - win.w, y: vp.h - MARGIN - win.h })
  })
})

describe('resizeRect', () => {
  it('a borda direita e a de baixo crescem e o canto de cima fica parado', () => {
    expect(resizeRect(win, 'se', 50, 40, vp)).toEqual({ x: 400, y: 200, w: 450, h: 540 })
  })

  it('a borda esquerda e a de cima crescem para o outro lado, e o lado oposto fica parado', () => {
    const out = resizeRect(win, 'nw', -60, -50, vp)
    expect(out).toEqual({ x: 340, y: 150, w: 460, h: 550 })
    expect(out.x + out.w).toBe(win.x + win.w)
    expect(out.y + out.h).toBe(win.y + win.h)
  })

  it('uma borda só mexe numa medida', () => {
    expect(resizeRect(win, 'e', 25, 999, vp)).toEqual({ ...win, w: 425 })
    expect(resizeRect(win, 's', 999, 25, vp)).toEqual({ ...win, h: 525 })
    expect(resizeRect(win, 'w', -25, 999, vp)).toEqual({ ...win, x: 375, w: 425 })
    expect(resizeRect(win, 'n', 999, -25, vp)).toEqual({ ...win, y: 175, h: 525 })
  })

  it('não encolhe além do mínimo e o lado oposto não se mexe', () => {
    const out = resizeRect(win, 'nw', 9999, 9999, vp)
    expect(out).toMatchObject({ w: MIN_W, h: MIN_H })
    expect(out.x + out.w).toBe(win.x + win.w)
    expect(out.y + out.h).toBe(win.y + win.h)
  })

  it('não cresce além da tela', () => {
    const out = resizeRect(win, 'se', 9999, 9999, vp)
    expect(out.x + out.w).toBe(vp.w - MARGIN)
    expect(out.y + out.h).toBe(vp.h - MARGIN)
    const west = resizeRect(win, 'nw', -9999, -9999, vp)
    expect(west.x).toBe(MARGIN)
    expect(west.y).toBe(MARGIN)
  })
})

describe('o que fica no aparelho', () => {
  it('guarda e lê, por painel', () => {
    const store = memory()
    saveWindow('layers', win, store)
    expect(readWindow('layers', store)).toEqual(win)
    expect(readWindow('filters', store)).toBeNull()
  })

  it('arredonda para pixel inteiro', () => {
    const store = memory()
    saveWindow('layers', { x: 10.4, y: 20.6, w: 400.2, h: 500.5 }, store)
    expect(readWindow('layers', store)).toEqual({ x: 10, y: 21, w: 400, h: 501 })
  })

  it('valor estranho vira "não salvo", nunca um erro', () => {
    const store = memory()
    store.setItem('prisma:mapa:janela:layers', '{não é json')
    expect(readWindow('layers', store)).toBeNull()
    store.setItem('prisma:mapa:janela:layers', JSON.stringify({ v: 9, x: 1, y: 1, w: 1, h: 1 }))
    expect(readWindow('layers', store)).toBeNull()
    store.setItem('prisma:mapa:janela:layers', JSON.stringify({ v: 1, x: 'a', y: 1, w: 400, h: 400 }))
    expect(readWindow('layers', store)).toBeNull()
    store.setItem('prisma:mapa:janela:layers', JSON.stringify({ v: 1, x: 1, y: 1, w: 0, h: 400 }))
    expect(readWindow('layers', store)).toBeNull()
  })

  it('limpar esquece, e sem armazenamento nada quebra', () => {
    const store = memory()
    saveWindow('layers', win, store)
    clearWindow('layers', store)
    expect(readWindow('layers', store)).toBeNull()
    expect(() => { saveWindow('layers', win, null); clearWindow('layers', null) }).not.toThrow()
    expect(readWindow('layers', null)).toBeNull()
  })
})
