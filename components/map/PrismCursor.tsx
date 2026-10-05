'use client'

// Cursor "Prisma aurora" (DESIGN.md, seção 10): um elemento desenhado pelo site que segue o ponteiro.
// Custo: roda código a cada movimento e some em touch; por isso o cursor nativo só é escondido DEPOIS do
// primeiro movimento (data-pc-ready no <html>). Estados: default · link (verde + borda em degradê) · no (bloqueado)
// · text (some; fica o I-beam) · native (mira de medir/inspecionar: some; fica o crosshair do mapa).
import { useEffect, useRef, useState } from 'react'

const PRISM = 'M4.5 3 L21 11 L13 13 L10 21.5 Z'
const TIP = { x: 4.5, y: 3 } // ponta do prisma dentro do SVG de 30px
const CLICKABLE = 'button, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="switch"], [role="checkbox"], a[href], summary, label[for], input[type="checkbox"], input[type="radio"]'
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]), textarea, [contenteditable="true"], select'
const BLOCKED = 'button:disabled, [aria-disabled="true"], [data-disabled]'

export function PrismCursor() {
  const wrap = useRef<HTMLDivElement>(null)
  const [calm, setCalm] = useState(false) // prefers-reduced-motion: o degradê fica parado

  useEffect(() => { setCalm(window.matchMedia('(prefers-reduced-motion: reduce)').matches) }, [])

  useEffect(() => {
    const root = document.documentElement
    const box = wrap.current
    if (!box) return
    let x = -100, y = -100, raf = 0, ready = false
    let state = 'default'

    // botão desabilitado tem pointer-events:none (shadcn): o hit-test não o enxerga, então detecta pela geometria
    const blockedAt = (px: number, py: number) =>
      Array.from(document.querySelectorAll<HTMLElement>(BLOCKED)).some((e) => {
        const r = e.getBoundingClientRect()
        return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom
      })
    // o MapLibre decide o cursor do mapa pelo estilo do contêiner do canvas, não por um elemento clicável
    const mapCursor = (t: Element) => (t.closest('.maplibregl-canvas-container') as HTMLElement | null)?.style.cursor
    const kind = (t: Element | null, blocked: boolean) => {
      if (!t) return 'default'
      if (t.closest(TEXT)) return 'text'
      if (blocked) return 'no'
      const mc = mapCursor(t)
      if (mc === 'crosshair') return 'native'
      if (mc === 'pointer' || t.closest(CLICKABLE)) return 'link'
      return 'default'
    }
    const place = () => {
      raf = 0
      box.style.transform = `translate3d(${x - TIP.x}px, ${y - TIP.y}px, 0)`
      const next = kind(document.elementFromPoint(x, y), blockedAt(x, y))
      if (next === state) return
      state = next
      box.dataset.state = next
      if (next === 'native') root.setAttribute('data-pc-native', '')
      else root.removeAttribute('data-pc-native')
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      x = e.clientX; y = e.clientY
      if (!ready) { ready = true; root.setAttribute('data-pc-ready', ''); box.dataset.visible = '1' }
      if (!raf) raf = requestAnimationFrame(place)
    }
    const press = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      box.dataset.down = '1'
      const ring = document.createElement('span') // círculo leve que nasce na ponta e se dissolve
      ring.className = 'pc-ring'
      ring.style.left = `${e.clientX}px`
      ring.style.top = `${e.clientY}px`
      document.body.appendChild(ring)
      setTimeout(() => ring.remove(), 520)
    }
    const release = () => { delete box.dataset.down }
    const leave = (e: MouseEvent) => { if (!e.relatedTarget) delete box.dataset.visible }
    const enter = () => { if (ready) box.dataset.visible = '1' }

    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerdown', press, { passive: true })
    document.addEventListener('pointerup', release, { passive: true })
    document.addEventListener('mouseout', leave)
    document.addEventListener('mouseover', enter)
    return () => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerdown', press)
      document.removeEventListener('pointerup', release)
      document.removeEventListener('mouseout', leave)
      document.removeEventListener('mouseover', enter)
      if (raf) cancelAnimationFrame(raf)
      root.removeAttribute('data-pc-ready')
      root.removeAttribute('data-pc-native')
    }
  }, [])

  return (
    <div ref={wrap} className="pc-cursor" data-state="default" aria-hidden>
      <svg width="30" height="30" viewBox="0 0 30 30" style={{ overflow: 'visible' }}>
        <defs>
          {/* "grande tela" na diagonal: o degradê se repete e desliza; só aparece pelo traço da borda.
              Deslocar exatamente um período (18,18) fecha o laço, sem pulo. Ocre, terracota, verde, ardósia. */}
          <linearGradient id="pc-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="18" y2="18" spreadMethod="repeat">
            <stop offset="0" style={{ stopColor: 'var(--color-warn)' }} />
            <stop offset="0.25" style={{ stopColor: 'var(--color-crit)' }} />
            <stop offset="0.5" style={{ stopColor: 'var(--color-mineral)' }} />
            <stop offset="0.75" style={{ stopColor: 'var(--color-map-water-text)' }} />
            <stop offset="1" style={{ stopColor: 'var(--color-warn)' }} />
            {!calm && <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="18 18" dur="2.2s" repeatCount="indefinite" />}
          </linearGradient>
        </defs>
        <path d={PRISM} className="pc-aurora" />
        <path d={PRISM} className="pc-halo" />
        <path d={PRISM} className="pc-body" />
        <path d="M4.5 3 L13 13" className="pc-facet" />
        <path d={PRISM} className="pc-edge" />
        <g className="pc-ban">
          <circle cx="19" cy="19" r="5" />
          <path d="M15.5 22.5 L22.5 15.5" />
        </g>
      </svg>
    </div>
  )
}
