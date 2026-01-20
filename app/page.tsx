import Link from "next/link"
import Image from "next/image"
import { ContactModal } from "@/components/contact-modal"
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
  FileCheck,
  AlertTriangle,
  ShieldAlert,
  History,
  Leaf,
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
            <ContactModal>
              <Button className="bg-brand-primary hover:bg-blue-600 text-white border-0 font-medium">
                  Agendar Apresentação
              </Button>
            </ContactModal>
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
                  <ContactModal>
                    <Button size="lg" className="bg-brand-primary hover:bg-blue-600 text-white border-0 px-8 h-12 text-base">
                      Agendar Apresentação Técnica
                    </Button>
                  </ContactModal>
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
                  <div className="flex-1 relative ">
                     {/* Map Background Placeholder */}
                     <div className="absolute inset-0 ">
   {/* A imagem fica por baixo da cor de fundo se quiser misturar, ou ajuste a opacidade */}
   <Image 
      src="/MAPA-PRISMA.JPG"
      alt="Mapa de Fundo"
      fill // Faz a imagem preencher o pai (absolute inset-0)
      className="object-cover " // object-cover evita distorção
      priority // Carrega rápido se for visível logo de início
   />
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
 <section className="w-full py-20 bg-brand-dark border-b border-white/5 relative overflow-hidden">
      {/* (Opcional) Um brilho de fundo sutil para dar profundidade */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-primary/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>

      <div className="container px-4 md:px-6 relative z-10">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col items-center text-center space-y-6 mb-16">
           <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
             Validação Territorial e <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Alianças Estratégicas.</span>
           </h2>
           <div className="h-1 w-20 bg-brand-primary/40 rounded-full"></div>
           <p className="text-slate-400 max-w-2xl text-base leading-relaxed font-light">
             Nossa inteligência é desenvolvida e aprimorada em cooperação direta com organizações que atuam na linha de frente da preservação de biomas críticos e na gestão de ativos de ecoturismo de classe mundial.
           </p>
        </div>

        {/* Grid de Parceiros */}
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 max-w-5xl mx-auto items-start">
          
          {/* --- Parceiro 1: IHP --- */}
          <div className="flex flex-col items-center group">
             {/* Container da Imagem (Estilo Novo) */}
             <div className="relative h-40 w-full max-w-[280px] mb-6 transition-transform duration-500 ease-out group-hover:scale-105">
                 <Image
                     src="/Marca_IHP_-_JPG_-_03-removebg-preview.png" // Certifique-se que este arquivo existe em /public
                     alt="Instituto Homem Pantaneiro"
                     width={320}
                     height={60}
                     className="object-contain drop-shadow-sm"
                     priority
                 />
             </div>
             {/* Texto Descritivo (Estilo Unificado) */}
             <h3 className="text-white font-semibold mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">IHP</h3>
             <p className="text-sm text-slate-300 font-medium max-w-xs text-center leading-relaxed group-hover:text-white transition-colors duration-300">
                 Cooperação técnica na proteção e monitoramento do Bioma Pantanal.
             </p>
          </div>

          {/* --- Parceiro 2: Rio da Prata --- */}
          <div className="flex flex-col items-center group mt-8 md:mt-0">
             {/* Container da Imagem (Aplicando o MESMO estilo novo do IHP) */}
             <div className="relative h-40 w-full max-w-[280px] mb-6 transition-transform duration-500 ease-out group-hover:scale-105">
                 <Image 
                   src="/logo_riodaprata.png" // Certifique-se que este arquivo existe em /public
                   alt="Grupo Rio da Prata" 
                   fill
                   // Nota: Se o logo do Rio da Prata for muito quadrado, talvez 'object-contain' deixe ele pequeno. 
                   // Se for o caso, mude o container 'h-40' para 'h-32 w-32' para logos quadrados, 
                   // mas tente manter a consistência visual.
                   className="object-contain drop-shadow-sm"
                 />
             </div>
             {/* Texto Descritivo (Estilo Unificado) */}
             <h3 className="text-white font-semibold mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">Grupo Rio da Prata</h3>
             <p className="text-sm text-slate-300 font-medium max-w-xs text-center leading-relaxed group-hover:text-white transition-colors duration-300">
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
        <section id="solucao" className="w-full py-24 bg-brand-dark overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* --- Coluna da Esquerda: Texto --- */}
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Seu Centro de Comando Ambiental.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-10">
              O Prisma decompõe a luz complexa de dados brutos — satélites, sensores, histórico — em espectros visíveis para decisão imediata. É a precisão técnica a serviço da estabilidade política.
            </p>

            <div className="space-y-8">
              {/* Item 1 */}
              <div className="flex gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors duration-300">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">De Monitoramento para Blindagem</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Centralize incêndios, desmatamento e turbidez de rios em uma única tela de alta definição. Identifique o problema antes que ele escale.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors duration-300">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">De Banco de Dados para Auditoria Visual</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    A "Prova Real". Acesse o histórico de qualquer propriedade ou rio em uma linha do tempo. Prove a fiscalização e exima a gestão atual.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors duration-300">
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

          {/* --- Coluna da Direita: Dashboard --- */}
          <div className="relative mt-8 lg:mt-0">
             {/* Efeito de brilho de fundo (Glow) */}
             <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
             
             {/* Container da Imagem estilo 'Window' */}
             <div className="relative rounded-xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
                {/* Barra de título do 'software' (opcional, puramente estético) */}
                <div className="h-8 bg-slate-800/50 border-b border-white/5 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                </div>

                {/* Imagem do Dashboard */}
                <div className="relative w-full aspect-[16/10]"> {/* Ajustado para formato widescreen */}
                    <Image
                        src="/dashboard.JPG"
                        alt="Painel de Controle Prisma - Monitoramento em Tempo Real"
                        fill
                        className="object-cover object-top" // Foca no topo se cortar, ou use 'contain' para mostrar tudo
                        sizes="(max-width: 768px) 100vw, 50vw"
                        quality={90}
                        priority
                    />
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
             <h2 className="text-3xl font-bold text-white mb-4">Um Ecossistema Completo de Inteligência.</h2>
             <p className="text-slate-400">Funcionalidades desenhadas para cobrir cada etapa da gestão territorial estratégica.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             
             {/* 1. Alertas Críticos */}
             <div className="group bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:bg-slate-900/80 transition-all hover:border-brand-primary/30">
                <div className="mb-4 w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400 group-hover:text-red-300">
                   <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Monitoramento de Ameaças</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                   Detecção precoce de focos de incêndio e polígonos de desmatamento ilegal. O sistema destaca automaticamente as áreas de maior risco para ação preventiva imediata.
                </p>
                <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                   <li>Alertas de Desmatamento (DETER/PRODES)</li>
                   <li>Focos de Calor em Tempo Real</li>
                   <li>Mapa de Calor de Risco Crítico</li>
                </ul>
             </div>

             {/* 2. Recursos Hídricos (Turbidez) */}
             <div className="group bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:bg-slate-900/80 transition-all hover:border-brand-primary/30">
                <div className="mb-4 w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 group-hover:text-blue-300">
                   <TrendingDown className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Inteligência Hídrica</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                   Análise avançada da qualidade da água. Compare visualmente a turbidez do rio "Antes x Agora" e identifique a origem exata dos sedimentos que afetam os rios.
                </p>
                <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                   <li>Monitoramento Diário de Turbidez</li>
                   <li>Comparativo Visual "Antes e Depois"</li>
                   <li>Rastreio de Plumas de Sedimentos</li>
                </ul>
             </div>

             {/* 3. Auditoria e Passivo */}
             <div className="group bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:bg-slate-900/80 transition-all hover:border-brand-primary/30">
                <div className="mb-4 w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400 group-hover:text-amber-300">
                   <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Gestão de Passivo Ambiental</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                   Controle rigoroso sobre o passivo ambiental das propriedades. Saiba exatamente onde há déficit de reserva legal ou áreas embargadas que exigem fiscalização.
                </p>
                <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                   <li>Cadastro Ambiental Rural (CAR)</li>
                   <li>Sobreposição de Áreas Embargadas</li>
                   <li>Déficit de Reserva Legal</li>
                </ul>
             </div>

             {/* 4. Restauração */}
             <div className="group bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:bg-slate-900/80 transition-all hover:border-brand-primary/30">
                <div className="mb-4 w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 group-hover:text-emerald-300">
                   <Leaf className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Acompanhamento de Restauração</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                   Não basta multar, é preciso recuperar. Monitore a evolução de projetos de plantio e regeneração natural através de índices de vegetação por satélite.
                </p>
                <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                   <li>Evolução de Plantio</li>
                   <li>Índices de Vegetação (NDVI/EVI)</li>
                   <li>Relatórios de Ganho de Biomassa</li>
                </ul>
             </div>

             {/* 5. Análise Histórica */}
             <div className="group bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:bg-slate-900/80 transition-all hover:border-brand-primary/30">
                <div className="mb-4 w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 group-hover:text-purple-300">
                   <History className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Retrovisor Temporal</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                   Viaje no tempo com nosso Dashboard de Análise Histórica. Entenda como o território mudou nos últimos 10 ou 20 anos para embasar decisões de futuro.
                </p>
                <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                   <li>Série Histórica de Imagens de Satélite</li>
                   <li>Gráficos de Tendência de Uso do Solo</li>
                   <li>Evolução do Desmatamento Acumulado</li>
                </ul>
             </div>

             {/* 6. Dossiês Automáticos */}
             <div className="group bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:bg-slate-900/80 transition-all hover:border-brand-primary/30">
                <div className="mb-4 w-12 h-12 bg-slate-100/10 rounded-lg flex items-center justify-center text-slate-200 group-hover:text-white">
                   <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Relatórios de Propriedade (Dossiê)</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                   Gere um raio-x completo de qualquer fazenda ou lote com um clique. Dados fundiários, fiscais e ambientais consolidados em um documento PDF oficial.
                </p>
                <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                   <li>Validação de CAR e SIGEF</li>
                   <li>Histórico de Multas e Embargos</li>
                   <li>Conformidade com Código Florestal</li>
                </ul>
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
              
               <ContactModal>
                 <Button size="lg" className="bg-brand-primary hover:bg-blue-600 text-white border-0 px-10 h-14 text-lg shadow-lg shadow-blue-900/20">
                    Solicitar Demonstração do Centro de Comando
                 </Button>
               </ContactModal>
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
