// A sensação de mover o mapa (DESIGN.md 13.7). O MapLibre vem com valores padrão; aqui estão os do Prisma, todos num lugar só para
// serem ajustados olhando a tela (só quem usa sente se o zoom e a inércia estão bons).

/** zoom por giro da roda do mouse: um pouco mais que o padrão (1/450), para cada giro andar mais */
export const WHEEL_ZOOM_RATE = 1 / 350
/** zoom do trackpad e do gesto de pinça (padrão 1/100) */
export const TRACKPAD_ZOOM_RATE = 1 / 70
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
