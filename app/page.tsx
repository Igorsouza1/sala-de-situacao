import Link from "next/link"
import Image from "next/image"
import { ContactModal } from "@/components/contact-modal"
import PillarScrollSection from "@/components/landing/pillar-scroll-section"
import TemperatureCard from "@/components/landing/temperature-card"
import WindCard from "@/components/landing/wind-card"
import WeatherDetailsCard from "@/components/landing/weather-details-card"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col w-full bg-white font-sans selection:bg-black/10 text-[#1d1d1f]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full h-11 border-b border-black/[0.06] bg-white/90 backdrop-blur-md">
        <div className="container flex h-full items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-01.jpeg"
              alt="PRISMA"
              width={26}
              height={26}
              className="rounded-md object-cover"
            />
            <span className="text-sm font-semibold tracking-tight text-[#1d1d1f]">
              Prisma
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/sign-in"
              className="hidden md:block text-[11px] text-[#1d1d1f]/40 hover:text-[#1d1d1f] transition-colors"
            >
              Acesso Seguro
            </Link>
            <ContactModal>
              <button className="text-[11px] font-medium text-white bg-[#1d1d1f] hover:bg-black active:scale-95 transition-all px-4 py-1.5 rounded-full">
                Agendar Demonstração
              </button>
            </ContactModal>
          </div>
        </div>
      </header>

      <main>

        {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
        <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#f5f5f7]">

          {/* Map — subtil, quase marca d'água */}
          <div className="absolute inset-0">
            <Image
              src="/MAPA-PRISMA.JPG"
              alt=""
              fill
              className="object-cover opacity-[0.08] grayscale"
              priority
            />
            {/* Vinhetas suaves nas bordas */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#f5f5f7] via-transparent to-[#f5f5f7] opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#f5f5f7] via-transparent to-[#f5f5f7] opacity-60" />
          </div>

          {/* Floating Weather Cards */}
          <div className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden">
            {/* Left Top: Temperature */}
            <TemperatureCard className="absolute left-4 xl:left-8 top-[24%] xl:top-[26%] pointer-events-auto flex opacity-20 blur-[1.5px] xl:opacity-100 xl:blur-none scale-75 sm:scale-100 origin-top-left transition-all duration-700" />

            {/* Right Top: Wind */}
            <WindCard className="absolute right-4 xl:right-8 top-[14%] xl:top-[16%] pointer-events-auto flex opacity-20 blur-[1.5px] xl:opacity-100 xl:blur-none scale-75 sm:scale-100 origin-top-right transition-all duration-700" />

            {/* Right Bottom: Weather Details */}
            <WeatherDetailsCard className="absolute right-4 xl:right-8 top-[36%] xl:top-[38%] pointer-events-auto flex opacity-15 blur-[2px] xl:opacity-100 xl:blur-none scale-[0.65] sm:scale-100 origin-top-right transition-all duration-700" />
          </div>

          {/* Copy */}
          <div className="relative z-30 text-center px-4 max-w-2xl xl:max-w-3xl mx-auto pt-16">
            {/* Ambient white glow behind text on smaller screens to ensure maximum legibility */}
            <div className="absolute -inset-16 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.85)_0%,rgba(255,255,255,0.5)_50%,transparent_75%)] pointer-events-none -z-10 xl:hidden" />

            <h1 className="text-5xl md:text-7xl lg:text-[82px] font-semibold tracking-[-0.03em] leading-[1.04] text-[#1d1d1f] mb-6 text-balance">
              A complexidade do seu território, traduzida em clareza visual.
            </h1>
            <p className="text-base md:text-lg text-[#1d1d1f]/70 xl:text-[#1d1d1f]/50 font-normal xl:font-light max-w-2xl mx-auto mb-10 leading-relaxed">
              O Prisma integra dados de satélite, registros ambientais e sensores de campo em uma única plataforma geoespacial. Feito para quem precisa analisar, gerenciar e auditar áreas com o máximo de precisão.
            </p>
            <ContactModal>
              <button className="inline-flex items-center text-sm font-medium text-white bg-[#1d1d1f] hover:bg-black active:scale-95 transition-all px-8 py-3.5 rounded-full">
                Solicitar Demonstração Técnica
              </button>
            </ContactModal>

            {/* Social Proof Discreto */}
            <div className="mt-20 flex flex-col items-center gap-4">
              <span className="text-[9px] tracking-[0.2em] uppercase text-[#1d1d1f]/45 font-light">
                A tecnologia geoespacial confiada por quem protege e gerencia os biomas mais críticos.
              </span>
              <div className="flex items-center justify-center gap-8 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                <div className="relative h-6 w-28">
                  <Image
                    src="/ihp-logo.png"
                    alt="Instituto Homem Pantaneiro"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="w-px h-3 bg-black/10" />
                <div className="relative h-6 w-28">
                  <Image
                    src="/logo_riodaprata.png"
                    alt="Grupo Rio da Prata"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fade para a próxima seção */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </section>

        {/* ── 3. Pain — giant quote ────────────────────────────────────────── */}
        <section id="problema" className="w-full py-36 md:py-52 bg-white">
          <div className="container px-6">
            <div className="max-w-4xl mx-auto">
              <p className="text-3xl md:text-5xl lg:text-[56px] font-semibold text-[#1d1d1f] tracking-[-0.02em] leading-[1.08] text-balance mb-8">
                &ldquo;Gerenciar uma área sem o cruzamento de dados geoespaciais é tentar ler uma história folheando páginas soltas.&rdquo;
              </p>
              <p className="text-base md:text-lg text-[#1d1d1f]/50 font-light max-w-3xl leading-relaxed">
                O espaço físico é vivo, interconectado e dinâmico. O Prisma une o que antes estava disperso: a malha das propriedades rurais, o comportamento dos corpos d'água e as dinâmicas de satélite. Uma ferramenta desenvolvida no campo para transformar dados complexos em diagnósticos visuais imediatos, dando segurança para o planejamento e para a tomada de decisão.
              </p>
              <div className="mt-14 w-10 h-px bg-black/15" />
            </div>
          </div>
        </section>

        {/* ── 4. Product in Action — scroll-driven ────────────────────────── */}
        <PillarScrollSection />

        {/* ── 5. Closing ──────────────────────────────────────────────────── */}
        <section className="w-full py-44 bg-[#f5f5f7] border-t border-black/[0.06]">
          <div className="container px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-semibold text-[#1d1d1f] tracking-[-0.025em] leading-[1.06] mb-6 text-balance">
              Elimine os pontos cegos da sua gestão geoespacial.
            </h2>
            <p className="text-base md:text-lg text-[#1d1d1f]/50 font-light max-w-xl mx-auto mb-10 leading-relaxed">
              Centralize seus mapas, análises e relatórios em uma plataforma robusta e escalável.
            </p>
            <ContactModal>
              <button className="inline-flex items-center text-sm font-medium text-[#1d1d1f] border border-[#1d1d1f]/20 bg-white hover:bg-[#1d1d1f]/5 active:scale-95 transition-all px-10 py-4 rounded-full">
                Conhecer a Plataforma
              </button>
            </ContactModal>
          </div>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="w-full bg-[#f5f5f7] border-t border-black/[0.06] py-10">
        <div className="container px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-[#1d1d1f]/30">
          <span>© 2025 Prisma Environmental Intelligence.</span>
          <div className="flex gap-6">
            <span className="hover:text-[#1d1d1f]/60 cursor-pointer transition-colors">
              Política de Privacidade
            </span>
            <span className="hover:text-[#1d1d1f]/60 cursor-pointer transition-colors">
              Termos de Uso
            </span>
            <Link href="/sign-in" className="hover:text-[#1d1d1f]/60 transition-colors">
              Acesso Seguro
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
