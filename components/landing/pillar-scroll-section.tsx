"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

const pillars = [
  {
    number: "01",
    title: "Blindagem Territorial",
    headline: "Detecção em tempo real.",
    description:
      "Incêndios e desmatamentos ilegais identificados antes que se tornem crises públicas.",
  },
  {
    number: "02",
    title: "Ativos Hídricos",
    headline: "A clareza da água.",
    description:
      "Monitore a turbidez e identifique a origem exata do dano ambiental a montante.",
  },
  {
    number: "03",
    title: "Linha do Tempo",
    headline: "Retrovisor Temporal.",
    description:
      "O histórico inquestionável de qualquer propriedade na ponta dos dedos. A prova real.",
  },
]

function MapVisual({ active }: { active: number }) {
  return (
    <div className="relative w-full h-full bg-[#060606] rounded-2xl overflow-hidden border border-white/[0.06]">
      {/* Base map */}
      <div className="absolute inset-0">
        <Image
          src="/MAPA-PRISMA.JPG"
          alt=""
          fill
          className="object-cover opacity-25"
          sizes="(max-width: 1024px) 0px, 45vw"
        />
      </div>

      {/* Subtle topography grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #39ff6e 0px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, #39ff6e 0px, transparent 1px, transparent 48px)",
        }}
      />

      {/* Pillar 01 – Territory: red polygon + heat spot */}
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-in-out"
        style={{ opacity: active === 0 ? 1 : 0 }}
      >
        <div className="absolute top-[30%] left-[28%] w-[44%] h-[36%] border border-red-500/50 rounded-md">
          <div className="absolute inset-0 bg-red-500/8 rounded-md" />
        </div>
        <div className="absolute top-[38%] right-[34%] w-5 h-5 bg-orange-500 rounded-full blur-md animate-pulse" />
        <div className="absolute top-[50%] left-[36%] w-3 h-3 bg-red-500 rounded-full blur-sm animate-pulse [animation-delay:400ms]" />
        <div className="absolute top-[34%] left-[45%] w-2 h-2 bg-amber-400 rounded-full blur-sm animate-pulse [animation-delay:800ms]" />
      </div>

      {/* Pillar 02 – Water: thermal plume */}
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-in-out"
        style={{ opacity: active === 1 ? 1 : 0 }}
      >
        <div className="absolute bottom-[28%] left-[22%] w-[60%] h-[30%] bg-gradient-to-r from-cyan-500/25 via-blue-500/15 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-[35%] left-[30%] w-[35%] h-[20%] bg-teal-400/15 rounded-full blur-xl" />
        <div className="absolute bottom-[32%] left-[22%] right-[30%] h-px bg-cyan-400/40" />
        <div className="absolute bottom-[28%] left-[22%] w-2 h-2 bg-cyan-400 rounded-full blur-sm" />
      </div>

      {/* Pillar 03 – Timeline: scrubber UI */}
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-in-out"
        style={{ opacity: active === 2 ? 1 : 0 }}
      >
        {/* Year badge top-right */}
        <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-black/50 border border-white/10 rounded px-2.5 py-1">
          <span className="text-white/40 text-[10px] font-mono">◀</span>
          <span className="text-white/70 text-[11px] font-mono">2018</span>
        </div>
        {/* Progress bar bottom */}
        <div className="absolute bottom-8 left-6 right-6">
          <div className="flex justify-between text-[10px] font-mono text-white/30 mb-2">
            <span>2004</span>
            <span>2024</span>
          </div>
          <div className="h-0.5 bg-white/10 rounded-full relative">
            <div className="h-full w-[62%] bg-white/40 rounded-full" />
            <div className="absolute top-1/2 left-[62%] -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          </div>
        </div>
      </div>

      {/* Corner label */}
      <div className="absolute top-4 left-4 text-[9px] font-mono text-white/20 tracking-widest uppercase">
        PRISMA · Sala de Situação
      </div>
    </div>
  )
}

export default function PillarScrollSection() {
  const [activePillar, setActivePillar] = useState(0)
  const pillarRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers = pillarRefs.current.map((ref, idx) => {
      if (!ref) return null
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActivePillar(idx)
        },
        { threshold: 0.55, rootMargin: "-10% 0px -10% 0px" }
      )
      observer.observe(ref)
      return observer
    })
    return () => observers.forEach((o) => o?.disconnect())
  }, [])

  return (
    <section id="solucao" className="w-full bg-white border-y border-black/[0.06]">
      <div className="container px-6 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#1d1d1f]/30 mb-4">
            O Produto em Ação
          </p>
          <h2 className="text-4xl md:text-5xl font-semibold text-[#1d1d1f] tracking-[-0.02em] leading-[1.08] mb-24">
            Três pilares.<br />Um território blindado.
          </h2>

          <div className="relative grid lg:grid-cols-2 gap-20 items-start">
            {/* Left: pillars */}
            <div>
              {pillars.map((pillar, idx) => (
                <div
                  key={pillar.number}
                  ref={(el) => { pillarRefs.current[idx] = el }}
                  className="py-14 border-b border-black/[0.06] last:border-0"
                >
                  <div className="flex items-start gap-6">
                    <span className="text-[10px] font-mono text-[#1d1d1f]/20 mt-2 flex-shrink-0 tracking-widest">
                      {pillar.number}
                    </span>
                    <div>
                      <p className="text-[10px] tracking-[0.18em] uppercase text-[#1d1d1f]/30 mb-3">
                        {pillar.title}
                      </p>
                      <h3 className="text-2xl md:text-3xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">
                        {pillar.headline}
                      </h3>
                      <p className="text-[15px] text-[#1d1d1f]/50 leading-relaxed max-w-xs">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: sticky map — interface do produto permanece escura */}
            <div className="hidden lg:block sticky top-24 h-[500px]">
              <MapVisual active={activePillar} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
