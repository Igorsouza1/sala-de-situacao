// A sensação de mover o mapa (DESIGN.md 13.7). O MapLibre vem com valores padrão; aqui estão os do Prisma, todos num lugar só para
// serem ajustados olhando a tela (só quem usa sente se o zoom e a inércia estão bons).

/** inércia ao soltar o arrasto: desliza mais e por mais tempo que o padrão (linearity 0,3 · deceleration 2500 · maxSpeed 1400), sem exagero */
export const DRAG_PAN = { linearity: 0.25, deceleration: 1700, maxSpeed: 1700 } as const

/** quanto uma seta move o mapa (px) e quanto o + e o − aproximam (níveis); com Shift, o dobro */
export const KEY_PAN_PX = 140
export const KEY_ZOOM_STEP = 1
export const KEY_MOVE_MS = 260

export type KeyAction =
  | { type: 'pan'; dx: number; dy: number }
  | { type: 'zoom'; delta: number }
  | { type: 'fit' }

interface KeyLike {
  key: string
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  defaultPrevented: boolean
}

interface TargetLike {
  closest?: (selector: string) => unknown
}

// Onde as teclas são da própria coisa e não do mapa: campos de texto, menus, seletores, painéis (a seta rola o painel), o modal.
const OWNS_KEYS = 'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="listbox"], [role="menu"], [role="radiogroup"], [role="slider"], [role="dialog"], [data-panel-scroll]'

/** a tecla é do mapa? Setas movem, + e − dão zoom e Home enquadra a região; nada disso se a tecla é de outra coisa em foco */
export function mapKeyAction(e: KeyLike, target: TargetLike | null): KeyAction | null {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return null
  if (target?.closest?.(OWNS_KEYS)) return null
  const step = KEY_PAN_PX * (e.shiftKey ? 2 : 1)
  switch (e.key) {
    case 'ArrowLeft': return { type: 'pan', dx: -step, dy: 0 }
    case 'ArrowRight': return { type: 'pan', dx: step, dy: 0 }
    case 'ArrowUp': return { type: 'pan', dx: 0, dy: -step }
    case 'ArrowDown': return { type: 'pan', dx: 0, dy: step }
    case '+':
    case '=': return { type: 'zoom', delta: KEY_ZOOM_STEP * (e.shiftKey ? 2 : 1) }
    case '-':
    case '_': return { type: 'zoom', delta: -KEY_ZOOM_STEP * (e.shiftKey ? 2 : 1) }
    case 'Home': return { type: 'fit' }
    default: return null
  }
}

// ── Zoom da roda com movimento próprio (13.7) ───────────────────────────────────────────────────────────────────────────────────
// O suavizado do zoom do MapLibre é só o dele (mudar a taxa mudava pouco): a roda passa a somar a um DESTINO de zoom, e o mapa anda
// até lá a cada quadro, ancorado no ponto do mouse. O alisamento é por tempo (igual em 60 e em 144 Hz), como o do cursor.
/** níveis de zoom por pixel de rolagem: um giro de roda (~100 px) dá ~0,28 */
export const WHEEL_ZOOM_PER_PX = 0.0028
/** o gesto de pinça no trackpad manda deltas pequenos com ctrlKey */
export const PINCH_ZOOM_PER_PX = 0.012
/** quanto o zoom demora a alcançar o destino (ms): menos é mais seco, mais é mais solto */
export const ZOOM_SMOOTH_TAU = 110

interface WheelLike { deltaY: number; deltaMode: number; ctrlKey: boolean }

/** quantos níveis de zoom um evento de roda vale (positivo aproxima) */
export function wheelZoomDelta(e: WheelLike): number {
  // deltaMode: 0 pixels, 1 linhas (~16 px cada), 2 páginas (~400 px)
  const px = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1)
  const limited = Math.max(-300, Math.min(300, px)) // uma roda muito rápida não pode dar um salto enorme
  return -limited * (e.ctrlKey ? PINCH_ZOOM_PER_PX : WHEEL_ZOOM_PER_PX)
}
