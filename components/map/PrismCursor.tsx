'use client'

// Cursor "Prisma aurora" (DESIGN.md, seção 10): um elemento desenhado pelo site que segue o ponteiro.
// Custo: roda código a cada movimento e some em touch; por isso o cursor nativo só é escondido DEPOIS do
// primeiro movimento (data-pc-ready no <html>). Estados: default · link (verde + borda em degradê) · no (bloqueado)
// · text (some; fica o I-beam) · native (mira de medir/inspecionar: some; fica o crosshair do mapa).
import { useEffect, useRef, useState } from 'react'

const PRISM = 'M4.5 3 L21 11 L13 13 L10 21.5 Z'
const TAU = 15 // ms: quanto o prisma demora a alcançar o ponteiro (menos = mais colado, mais = mais solto)
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
    let ready = false
    let state = 'default'
    let lastCheck = 0
    let lastTarget: Element | null = null
    // Deslizar (o "a mais" do Mac): o prisma não salta para onde o ponteiro está, ele escorrega até lá. É um alisamento por tempo
    // (não por quadro), então é igual em 60 e em 144 Hz; com TAU curto o atraso some em ~100 ms e a mira continua fiel.
    // Com movimento reduzido ele vai direto. O laço só roda enquanto há caminho a andar.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let tx = -100, ty = -100, cx = -100, cy = -100, raf = 0, prev = 0
    const glide = (now: number) => {
      const dt = Math.min(now - prev, 64)
      prev = now
      const k = reduce ? 1 : 1 - Math.exp(-dt / TAU)
      cx += (tx - cx) * k
      cy += (ty - cy) * k
      const done = Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05
      if (done) { cx = tx; cy = ty }
      box.style.transform = `translate3d(${cx - TIP.x}px, ${cy - TIP.y}px, 0)`
      raf = done ? 0 : requestAnimationFrame(glide)
    }

    // botão desabilitado tem pointer-events:none (shadcn): o hit-test não o enxerga, então detecta pela geometria.
    // Ler a geometria de tudo a cada movimento força o navegador a recalcular o layout (e no mapa isso trava o ponteiro);
    // por isso só se confere o estado de ~8 em 8 quadros (a cada 120 ms) e a posição é escrita sempre, sem esperar.
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
    const setState = (next: string) => {
      if (next === state) return
      state = next
      box.dataset.state = next
      if (next === 'native') root.setAttribute('data-pc-native', '')
      else root.removeAttribute('data-pc-native')
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      // o último ponto do quadro (o navegador junta vários movimentos num evento só): o prisma fica onde o ponteiro está
      const last = e.getCoalescedEvents?.().at(-1) ?? e
      tx = last.clientX; ty = last.clientY
      if (!ready) { ready = true; cx = tx; cy = ty; root.setAttribute('data-pc-ready', ''); box.dataset.visible = '1' }
      if (!raf) { prev = e.timeStamp; raf = requestAnimationFrame(glide) }
      const t = e.target instanceof Element ? e.target : null
      // trocou de elemento (ou está num campo de texto): confere na hora, para o prisma ficar verde ao entrar num botão; parado no mesmo elemento, só de 120 em 120 ms
      const changed = t !== lastTarget
      lastTarget = t
      if (!changed && e.timeStamp - lastCheck < 120 && state !== 'text') return
      lastCheck = e.timeStamp
      setState(kind(t, blockedAt(last.clientX, last.clientY)))
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
    // Só some quando o ponteiro saiu da janela de verdade: um mouseout sem destino também dispara quando o elemento sob o ponteiro
    // desaparece ou é refeito (rolar um painel, por exemplo), e aí o prisma sumia com o ponteiro ainda na tela.
    const leave = (e: MouseEvent) => {
      if (e.relatedTarget) return
      const outside = e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth - 1 || e.clientY >= window.innerHeight - 1
      if (outside) delete box.dataset.visible
    }
    const enter = () => { if (ready) box.dataset.visible = '1' }

    // Rolar com a roda não move o ponteiro: o navegador não manda pointermove e o que está sob o ponteiro muda. Sem tratar isso, o
    // prisma ficava parado no estado de antes (e o cursor do sistema voltava a aparecer, porque o navegador só reavalia o cursor
    // no próximo movimento). Durante e logo depois da rolagem, o estado é reconferido no ponto onde o ponteiro está.
    let scrollRaf = 0
    const refresh = () => {
      scrollRaf = 0
      if (!ready) return
      box.dataset.visible = '1'
      root.setAttribute('data-pc-ready', '')
      const t = document.elementFromPoint(tx, ty)
      lastTarget = t
      setState(kind(t, blockedAt(tx, ty)))
    }
    const onScroll = () => { if (ready && !scrollRaf) scrollRaf = requestAnimationFrame(refresh) }

    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('wheel', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, { passive: true, capture: true })
    document.addEventListener('pointerdown', press, { passive: true })
    document.addEventListener('pointerup', release, { passive: true })
    document.addEventListener('mouseout', leave)
    document.addEventListener('mouseover', enter)
    return () => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('wheel', onScroll)
      document.removeEventListener('scroll', onScroll, true)
      if (scrollRaf) cancelAnimationFrame(scrollRaf)
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
