import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Shield,
  Clock,
  Megaphone,
  TrendingDown,
  Search,
  Lock,
  Smartphone,
  FileText,
  Droplets,
  ChevronRight,
  Menu,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col w-full bg-brand-dark font-sans selection:bg-brand-primary/30 text-slate-200">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-brand-dark/80 backdrop-blur-md supports-[backdrop-filter]:bg-brand-dark/60">
        <div className="container flex h-18 items-center justify-between">
          <div className="flex items-center gap-2 pl-4">
            <Image src="/logo.png" alt="Logo" width={140} height={140} />
            {/* <span className="text-xl font-bold tracking-tight text-white">PRISMA</span> */}
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#problema"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              O Problema
            </Link>
            <Link
              href="#solucao"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              A Solução
            </Link>
            <Link
              href="#funcionalidades"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Funcionalidades
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                Acesso Seguro
              </Button>
            </Link>
            <Button className="bg-brand-primary hover:bg-blue-600 text-white border-0 font-medium">
                Agendar Apresentação
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        
        {/* 1. Hero Section (A Promessa de Autoridade) */}
        <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden border-b border-white/5 bg-brand-dark">
          <div className="container px-4 md:px-6 relative z-10 text-center">
            
            <div className="max-w-4xl mx-auto space-y-6 mb-12">
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                  Antecipe crises. <br/>
                  <span className="text-brand-primary">Governe com dados.</span>
                </h1>
                
                <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto font-light">
                  O Prisma não é apenas um software de visualização. É a sua infraestrutura de segurança política e econômica. Transformamos dados ambientais brutos em uma Sala de Situação unificada, blindando sua gestão contra o elemento surpresa.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button size="lg" className="bg-brand-primary hover:bg-blue-600 text-white border-0 px-8 h-12 text-base">
                    Agendar Apresentação Técnica
                  </Button>
                </div>
                
                <div className="pt-2">
                   <Link href="#solucao" className="text-sm text-slate-400 hover:text-white transition-colors border-b border-transparent hover:border-slate-400 pb-0.5">
                      Entenda o conceito de "Inteligência que Blinda" ↓
                   </Link>
                </div>
            </div>

            {/* Mockup Interface "Clean Enterprise" */}
            <div className="relative max-w-5xl mx-auto mt-16 group">
                <div className="absolute -inset-1 bg-gradient-to-t from-brand-primary/20 to-transparent rounded-lg blur-xl opacity-30"></div>
                <div className="relative bg-slate-950 rounded-lg border border-white/10 shadow-2xl overflow-hidden aspect-[21/9] flex flex-col">
                  {/* Window Header */}
                  <div className="h-8 bg-slate-900 border-b border-white/5 flex items-center px-4 gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    <div className="ml-auto text-[10px] text-slate-500 font-mono">PRISMA_SALA_DE_SITUACAO.EXE</div>
                  </div>
                  {/* Interface Content */}
                  <div className="flex-1 relative bg-slate-900">
                     {/* Map Background Placeholder */}
                     <div className="absolute inset-0 bg-brand-dark opacity-50">
                        {/* Abstract Map Grid */}
                        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.2 }}></div>
                     </div>
                     {/* Data Layers */}
                     <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500/10 rounded-full blur-xl border border-red-500/30 animate-pulse"></div>
                     <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-blue-500/10 rounded-full blur-xl border border-blue-500/30"></div>
                     
                     {/* Overlay UI Elements */}
                     <div className="absolute top-4 left-4 p-4 bg-slate-900/90 backdrop-blur border border-white/10 rounded w-64">
                        <div className="text-xs text-slate-400 font-mono mb-2 uppercase tracking-wider">Status Operacional</div>
                        <div className="flex items-center gap-2 mb-1">
                           <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                           <span className="text-sm text-white font-medium">Monitoramento Ativo</span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded mt-2 overflow-hidden">
                           <div className="h-full bg-emerald-500 w-full animate-pulse"></div>
                        </div>
                     </div>
                  </div>
                </div>
            </div>

          </div>
        </section>

        {/* Nova Seção Proposta: Alianças Estratégicas */}
        <section className="w-full py-16 bg-brand-dark border-b border-white/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4 mb-10">
               <h2 className="text-2xl md:text-3xl font-bold text-white">Validação Territorial e Alianças Estratégicas.</h2>
               <div className="h-0.5 w-24 bg-brand-primary/30 rounded-full"></div>
               <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
                  Nossa inteligência é desenvolvida e aprimorada em cooperação direta com organizações que atuam na linha de frente da preservação de biomas críticos e na gestão de ativos de ecoturismo de classe mundial.
               </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto pt-4">
               {/* Coluna da Esquerda - IHP */}
               <div className="flex flex-col items-center space-y-3 group">
                  <div className="h-24 w-48 flex items-center justify-center grayscale opacity-70 group-hover:opacity-100 transition-opacity bg-white/5 rounded-lg border border-white/5 p-4">
                     {/* Placeholder para Logo IHP - Substituir por imagem real */}
                     <span className="text-slate-300 font-bold tracking-widest text-center">INSTITUTO<br/>HOMEM PANTANEIRO</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium max-w-xs text-center">
                     Cooperação técnica na proteção e monitoramento do Bioma Pantanal.
                  </p>
               </div>

               {/* Coluna da Direita - Rio da Prata */}
               <div className="flex flex-col items-center space-y-3 group">
                  <div className="h-24 w-48 flex items-center justify-center grayscale opacity-70 group-hover:opacity-100 transition-opacity bg-white/5 rounded-lg border border-white/5 p-4 relative overflow-hidden">
                     {/* Logo Rio da Prata */}
                      <Image 
                        src="/riodaprata.jpeg" 
                        alt="Grupo Rio da Prata" 
                        fill
                        className="object-contain p-2"
                      />
                  </div>
                  <p className="text-xs text-slate-400 font-medium max-w-xs text-center">
                     Inteligência aplicada à gestão de ecoturismo e conservação de recursos hídricos em Bonito/MS.
                  </p>
               </div>
            </div>
          </div>
        </section>


        {/* 2. A Realidade da Gestão Pública (O Problema) */}
        <section id="problema" className="w-full py-24 bg-brand-dark-blue border-b border-white/5">
           <div className="container px-4 md:px-6">
              <div className="max-w-3xl mx-auto text-center mb-16">
                 <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">A gestão não pode depender da sorte.</h2>
                 <p className="text-slate-400 text-lg leading-relaxed">
                    No cenário atual, a secretaria que descobre o problema pela imprensa ou pela oposição já está atrasada. A falta de dados centralizados gera respostas lentas, crises políticas e insegurança econômica.
                 </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                 {/* Pilar 1 */}
                 <div className="p-8 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 text-slate-200">
                       <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Reação Tardia</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                       O tempo entre o incidente e a resposta oficial define a narrativa da crise. Cada minuto sem dados é um minuto de vulnerabilidade.
                    </p>
                 </div>

                 {/* Pilar 2 */}
                 <div className="p-8 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 text-slate-200">
                       <Megaphone className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Pressão da Imprensa</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                       A incapacidade de fornecer dados técnicos imediatos fragiliza a autoridade da gestão e dá espaço para especulações.
                    </p>
                 </div>

                 {/* Pilar 3 */}
                 <div className="p-8 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 text-slate-200">
                       <TrendingDown className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Risco Econômico</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                       Desastres ambientais não monitorados afetam diretamente receitas cruciais, como o turismo e investimentos regionais.
                    </p>
                 </div>
              </div>
           </div>
        </section>


        {/* 3. A Solução Prisma: Inteligência que Blinda */}
        <section id="solucao" className="w-full py-24 bg-brand-dark">
           <div className="container px-4 md:px-6">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                 <div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Seu Centro de Comando Ambiental.</h2>
                    <p className="text-slate-400 text-lg leading-relaxed mb-10">
                       O Prisma decompõe a luz complexa de dados brutos — satélites, sensores, histórico — em espectros visíveis para decisão imediata. É a precisão técnica a serviço da estabilidade política.
                    </p>

                    <div className="space-y-8">
                       <div className="flex gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary">
                             <Shield className="w-6 h-6" />
                          </div>
                          <div>
                             <h3 className="text-xl font-bold text-white mb-2">De Monitoramento para Blindagem</h3>
                             <p className="text-slate-400 text-sm leading-relaxed">
                                Centralize incêndios, desmatamento e turbidez de rios em uma única tela de alta definição. Identifique o problema antes que ele escale.
                             </p>
                          </div>
                       </div>

                       <div className="flex gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary">
                             <Search className="w-6 h-6" />
                          </div>
                          <div>
                             <h3 className="text-xl font-bold text-white mb-2">De Banco de Dados para Auditoria Visual</h3>
                             <p className="text-slate-400 text-sm leading-relaxed">
                                A "Prova Real". Acesse o histórico de qualquer propriedade ou rio em uma linha do tempo. Prove a fiscalização e exima a gestão atual.
                             </p>
                          </div>
                       </div>

                       <div className="flex gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary">
                             <Lock className="w-6 h-6" />
                          </div>
                          <div>
                             <h3 className="text-xl font-bold text-white mb-2">De Login para Acesso Seguro</h3>
                             <p className="text-slate-400 text-sm leading-relaxed">
                                Infraestrutura robusta com níveis de permissão hierárquicos, garantindo que a informação sensível esteja protegida.
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Visual da "Sala de Situação" - Mockup focado em camadas */}
                 <div className="relative">
                     <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-transparent rounded-2xl blur-2xl opacity-20"></div>
                    <div className="relative bg-slate-950 border border-white/10 rounded-xl shadow-2xl p-2 aspect-square flex items-center justify-center">
                        <div className="text-center space-y-4">
                           <div className="w-24 h-24 bg-brand-primary/20 rounded-full mx-auto flex items-center justify-center animate-pulse">
                              <Shield className="w-10 h-10 text-brand-primary" />
                           </div>
                           <div className="text-slate-500 font-mono text-xs uppercase tracking-widest">Interface de Blindagem</div>
                           <div className="text-white font-bold text-lg">Prisma Sala de Situação</div>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>


        {/* 4. Funcionalidades Estratégicas (UX B2G) */}
        <section id="funcionalidades" className="w-full py-24 bg-brand-dark-blue border-y border-white/5">
           <div className="container px-4 md:px-6">
              <div className="text-center mb-16">
                 <h2 className="text-3xl font-bold text-white mb-4">Desenhado para a velocidade do gabinete.</h2>
                 <p className="text-slate-400">Funcionalidades pensadas para a rotina real de quem toma decisão.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-12">
                 {/* Bloco 1: Panorama Executivo */}
                 <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 flex flex-col items-center text-center hover:bg-slate-900/80 transition-colors">
                    <div className="mb-6 p-4 bg-white/5 rounded-full">
                       <Smartphone className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">O Panorama Executivo</h3>
                     <p className="text-brand-primary font-medium mb-4 text-sm uppercase tracking-wide">Munição para despachar com o Prefeito</p>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-md mb-8">
                       Sabemos que o chefe do executivo não faz login. O Prisma gera resumos automáticos via WhatsApp. Situação controlada em poucas linhas.
                    </p>
                    
                    {/* Visual Mockup Chat */}
                    <div className="w-full max-w-xs bg-black/40 rounded-lg border border-white/5 p-4 text-left font-sans text-sm">
                        <div className="bg-brand-whatsapp text-white p-3 rounded-lg rounded-tl-none inline-block max-w-[90%] shadow-sm">
                          <p className="font-medium text-[10px] text-emerald-200 mb-1">Prisma Bot</p>
                          Prefeito, update do Prisma: Tivemos 2 ocorrências no Rio da Prata hoje cedo. Já enviamos equipe. Situação sob controle.
                          <div className="text-[10px] text-white/60 text-right mt-1">10:42</div>
                       </div>
                    </div>
                 </div>

                 {/* Bloco 2: Smart Reporting */}
                 <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 flex flex-col items-center text-center hover:bg-slate-900/80 transition-colors">
                    <div className="mb-6 p-4 bg-white/5 rounded-full">
                       <FileText className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Smart Reporting</h3>
                     <p className="text-brand-primary font-medium mb-4 text-sm uppercase tracking-wide">Geração de Nota Oficial Instantânea</p>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-md mb-8">
                       A imprensa questionou? Exporte um Boletim de Inteligência sóbrio em PDF, com mapa e logos oficiais em minutos. Pronto para a ASSECOM.
                    </p>
                    
                    {/* Visual Mockup PDF */}
                    <div className="w-full max-w-xs h-32 bg-white rounded flex flex-col shadow-lg overflow-hidden relative">
                       <div className="h-4 bg-slate-800 w-full mb-2"></div>
                       <div className="px-4 space-y-2">
                          <div className="h-2 bg-slate-200 w-3/4 rounded"></div>
                          <div className="h-2 bg-slate-200 w-1/2 rounded"></div>
                          <div className="h-8 bg-slate-100 w-full rounded mt-2 border border-slate-200 flex items-center justify-center text-[8px] text-slate-400">MAPA TÉCNICO</div>
                       </div>
                       <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-slate-200"></div>
                    </div>
                 </div>
              </div>
           </div>
        </section>


        {/* 5. O Impacto Econômico (Foco Turismo) */}
        <section className="relative w-full py-32 overflow-hidden">
           {/* Background subtil de rio/água */}
            <div className="absolute inset-0 bg-brand-dark">
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent"></div>
               {/* Pattern overlay */}
               <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
           </div>
           
           <div className="container px-4 md:px-6 relative z-10">
               <div className="max-w-3xl mx-auto text-center space-y-6">
                  <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-500/10 text-blue-400 mb-4">
                     <Droplets className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white">Inteligência estratégica para <br/> águas cristalinas.</h2>
                  <p className="text-xl text-slate-400 leading-relaxed font-light">
                     Proteger o meio ambiente é proteger a economia local. O Prisma garante a previsibilidade necessária para manter ativos turísticos e econômicos seguros, evitando manchetes negativas que afastam investimentos e visitantes.
                  </p>
               </div>
           </div>
        </section>


        

      </main>

      {/* 7. Rodapé e CTA Final */}
      <footer className="w-full bg-brand-dark border-t border-white/5 pt-20 pb-10">
        <div className="container px-4 md:px-6 text-center">
           <div className="max-w-4xl mx-auto space-y-8 mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Elimine o elemento surpresa da sua gestão.</h2>
              <p className="text-xl text-slate-400">Governe com a segurança de quem vê o cenário completo.</p>
              
               <Button size="lg" className="bg-brand-primary hover:bg-blue-600 text-white border-0 px-10 h-14 text-lg shadow-lg shadow-blue-900/20">
                  Solicitar Demonstração do Centro de Comando
              </Button>
           </div>

           <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
               <div className="flex gap-6">
                  <span className="hover:text-white cursor-pointer transition-colors">B2G Contact</span>
                  <span className="hover:text-white cursor-pointer transition-colors">LinkedIn</span>
               </div>
               <div>
                  © 2024 Prisma Environmental Intelligence. Todos os direitos reservados.
               </div>
               <div className="flex gap-6">
                  <span className="hover:text-white cursor-pointer transition-colors">Política de Privacidade</span>
                  <span className="hover:text-white cursor-pointer transition-colors">Termos de Uso</span>
               </div>
           </div>
        </div>
      </footer>
    </div>
  )
}
