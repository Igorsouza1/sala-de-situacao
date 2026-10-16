// A janela do painel de Camadas (DESIGN.md 13.1): onde ela está e quanto mede quando a pessoa a move ou a redimensiona.
// Só a conta, sem tela, para ser testada. Tudo em pixels da tela (viewport). O que a pessoa escolheu fica no aparelho;
// o que se mostra é sempre o escolhido DENTRO da tela de agora, sem apagar o escolhido (girar o aparelho ou encolher o navegador
// não pode destruir o lugar que ela deu à janela).

export interface WinRect {
  x: number
  y: number
  w: number
  h: number
}

export interface Viewport {
  w: number
  h: number
}

export type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export const MIN_W = 320
export const MIN_H = 280
/** a folga que a janela sempre deixa da borda da tela */
export const MARGIN = 12

const between = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max))
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** A janela dentro da tela: nem menor que o mínimo, nem maior que a tela, e sempre inteira à vista. */
export function clampRect(r: WinRect, vp: Viewport): WinRect {
  const w = between(r.w, MIN_W, vp.w - MARGIN * 2)
  const h = between(r.h, MIN_H, vp.h - MARGIN * 2)
  return {
    w,
    h,
    x: between(r.x, MARGIN, vp.w - MARGIN - w),
    y: between(r.y, MARGIN, vp.h - MARGIN - h),
  }
}

/** Arrastar pelo cabeçalho: anda sem mudar de tamanho e não sai da tela. */
export function moveRect(start: WinRect, dx: number, dy: number, vp: Viewport): WinRect {
  return clampRect({ ...start, x: start.x + dx, y: start.y + dy }, vp)
}

/** Arrastar uma borda ou um canto: o lado oposto fica parado. */
export function resizeRect(start: WinRect, dir: ResizeDir, dx: number, dy: number, vp: Viewport): WinRect {
  let { x, y, w, h } = start
  const right = start.x + start.w
  const bottom = start.y + start.h
  if (dir.includes('e')) w = between(start.w + dx, MIN_W, vp.w - MARGIN - start.x)
  if (dir.includes('w')) {
    w = between(start.w - dx, MIN_W, right - MARGIN)
    x = right - w
  }
  if (dir.includes('s')) h = between(start.h + dy, MIN_H, vp.h - MARGIN - start.y)
  if (dir.includes('n')) {
    h = between(start.h - dy, MIN_H, bottom - MARGIN)
    y = bottom - h
  }
  return { x, y, w, h }
}

// ── O que fica no aparelho ────────────────────────────────────────────────────────────────────────────────────────

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const VERSION = 1
const key = (id: string) => `prisma:mapa:janela:${id}`

const browserStore = (): Store | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** Lê o lugar e o tamanho guardados. Valor estranho (versão antiga, edição à mão) vira "não salvo", nunca um erro. */
export function readWindow(id: string, store: Store | null = browserStore()): WinRect | null {
  try {
    const raw = store?.getItem(key(id))
    if (!raw) return null
    const json = JSON.parse(raw)
    if (json?.v !== VERSION || !finite(json.x) || !finite(json.y) || !finite(json.w) || !finite(json.h)) return null
    if (json.w <= 0 || json.h <= 0) return null
    return { x: json.x, y: json.y, w: json.w, h: json.h }
  } catch {
    return null
  }
}

export function saveWindow(id: string, rect: WinRect, store: Store | null = browserStore()): void {
  try {
    store?.setItem(key(id), JSON.stringify({ v: VERSION, x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.w), h: Math.round(rect.h) }))
  } catch {
    /* sem armazenamento (janela privada, cheio): a janela funciona igual, só não lembra */
  }
}

export function clearWindow(id: string, store: Store | null = browserStore()): void {
  try {
    store?.removeItem(key(id))
  } catch {
    /* idem */
  }
}
