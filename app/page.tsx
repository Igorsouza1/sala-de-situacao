import Link from "next/link"
import Image from "next/image"
import { ContactModal } from "@/components/contact-modal"
import PillarScrollSection from "@/components/landing/pillar-scroll-section"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col w-full bg-white font-sans selection:bg-black/10 text-[#1d1d1f]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full h-11 border-b border-black/[0.06] bg-white/90 backdrop-blur-md">
        <div className="container flex h-full items-center justify-between px-6">
          <Image src="/logo.png" alt="PRISMA" width={110} height={110} />
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

          {/* Copy */}
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-16">
            <h1 className="text-5xl md:text-7xl lg:text-[82px] font-semibold tracking-[-0.03em] leading-[1.04] text-[#1d1d1f] mb-6 text-balance">
              A complexidade do seu território, traduzida em clareza visual.
            </h1>
            <p className="text-base md:text-lg text-[#1d1d1f]/50 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
              O Prisma integra dados de satélite, registros ambientais e sensores de campo em uma única plataforma geoespacial. Feito para quem precisa analisar, gerenciar e auditar áreas com o máximo de precisão científica.
            </p>
            <ContactModal>
              <button className="inline-flex items-center text-sm font-medium text-white bg-[#1d1d1f] hover:bg-black active:scale-95 transition-all px-8 py-3.5 rounded-full">
                Solicitar Demonstração Técnica
              </button>
            </ContactModal>
          </div>

          {/* Fade para a próxima seção */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </section>

        {/* ── 2. Alliances ────────────────────────────────────────────────── */}
        <section className="w-full py-14 bg-white border-b border-black/[0.06]">
          <div className="container px-6 text-center">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#1d1d1f]/30 mb-10">
              Desenvolvido em campo com quem protege os biomas mais críticos do planeta.
            </p>
            <div className="flex items-center justify-center gap-12 md:gap-20 flex-wrap">
              <div className="relative h-9 w-36 opacity-30 hover:opacity-50 transition-opacity duration-300">
                <Image
                  src="/Marca_IHP_-_JPG_-_03-removebg-preview.png"
                  alt="Instituto Homem Pantaneiro"
                  fill
                  className="object-contain filter grayscale"
                />
              </div>
              <div className="w-px h-6 bg-black/10 hidden md:block" />
              <div className="relative h-9 w-36 opacity-30 hover:opacity-50 transition-opacity duration-300">
                <Image
                  src="/logo_riodaprata.png"
                  alt="Grupo Rio da Prata"
                  fill
                  className="object-contain filter grayscale"
                />
              </div>
            </div>
          </div>
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
