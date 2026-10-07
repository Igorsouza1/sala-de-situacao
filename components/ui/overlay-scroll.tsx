"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Rolagem com a barra desenhada pelo projeto (DESIGN.md 10): o cursor Prisma é um elemento do site e a barra NATIVA do navegador
// não aceita `cursor: none`, então sobre ela voltava o cursor do sistema, a mesma cara de "travou". Aqui a barra nativa some e a
// nossa a substitui, fina e sobreposta ao conteúdo (como no Mac): aparece ao rolar e ao chegar o mouse, fica sob o prisma, dá para
// arrastar o polegar e clicar na trilha. A rolagem em si continua a do navegador (roda, toque, teclado).
//
// `className` e o resto vão para a área que rola (é nela que `data-panel-scroll` precisa ficar, para o ViewSwap rolar ao topo).
const THUMB_MIN = 36
const INSET = 4

const OverlayScroll = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, onScroll, ...props }, forwardedRef) => {
  const scroller = React.useRef<HTMLDivElement | null>(null)
  const [thumb, setThumb] = React.useState<{ top: number; height: number } | null>(null)
  const [awake, setAwake] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const sleepTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const setRefs = (node: HTMLDivElement | null) => {
    scroller.current = node
    if (typeof forwardedRef === "function") forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }

  const measure = React.useCallback(() => {
    const el = scroller.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollHeight <= clientHeight + 1) { setThumb(null); return }
    const track = clientHeight - INSET * 2
    const height = Math.max(THUMB_MIN, Math.round((clientHeight / scrollHeight) * track))
    const top = INSET + Math.round((scrollTop / (scrollHeight - clientHeight)) * (track - height))
    setThumb((prev) => (prev && prev.top === top && prev.height === height ? prev : { top, height }))
  }, [])

  const wake = React.useCallback(() => {
    setAwake(true)
    if (sleepTimer.current) clearTimeout(sleepTimer.current)
    sleepTimer.current = setTimeout(() => setAwake(false), 900)
  }, [])

  React.useEffect(() => {
    const el = scroller.current
    if (!el) return
    measure()
    // o conteúdo cresce e encolhe (as visões trocam com a altura acompanhando): a barra acompanha
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => { observer.disconnect(); if (sleepTimer.current) clearTimeout(sleepTimer.current) }
  }, [measure, children])

  const drag = React.useRef<{ startY: number; startScroll: number } | null>(null)
  const onThumbDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scroller.current
    if (!el) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startY: e.clientY, startScroll: el.scrollTop }
    setDragging(true)
  }
  const onThumbMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scroller.current
    if (!drag.current || !el || !thumb) return
    const track = el.clientHeight - INSET * 2 - thumb.height
    if (track <= 0) return
    el.scrollTop = drag.current.startScroll + ((e.clientY - drag.current.startY) / track) * (el.scrollHeight - el.clientHeight)
  }
  const onThumbUp = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = null
    setDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }
  // clicar na trilha, fora do polegar, rola uma página para o lado do clique
  const onTrackDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scroller.current
    if (!el || !thumb || e.target !== e.currentTarget) return
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    el.scrollBy({ top: (y < thumb.top ? -1 : 1) * el.clientHeight * 0.9, behavior: "smooth" })
  }

  return (
    <div className="relative flex min-h-0 flex-col" onPointerEnter={wake} onPointerMove={() => { if (!awake) wake() }}>
      <div
        ref={setRefs}
        onScroll={(e) => { measure(); wake(); onScroll?.(e) }}
        className={cn("min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
        {...props}
      >
        {children}
      </div>
      {thumb && (
        <div
          aria-hidden
          onPointerDown={onTrackDown}
          className={cn("absolute inset-y-0 right-0 w-3 transition-opacity duration-200", awake || dragging ? "opacity-100" : "opacity-0")}
        >
          <div
            onPointerDown={onThumbDown}
            onPointerMove={onThumbMove}
            onPointerUp={onThumbUp}
            onPointerCancel={onThumbUp}
            style={{ top: thumb.top, height: thumb.height }}
            className={cn(
              "absolute right-[3px] w-1.5 touch-none rounded-full transition-[background-color,width,right] duration-200 hover:right-[2px] hover:w-2",
              dragging ? "right-[2px] w-2 bg-foreground/55" : "bg-foreground/30 hover:bg-foreground/45",
            )}
          />
        </div>
      )}
    </div>
  )
})
OverlayScroll.displayName = "OverlayScroll"

export { OverlayScroll }
