import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowRight,
  Twitter,
  Linkedin,
  Github,
  BarChart3,
  Shield,
  Globe,
  Satellite,
  TrendingUp,
  Users,
  Award,
  CheckCircle,
  Play,
  Monitor,
  Zap,
} from "lucide-react"
import { MobileNav } from "@/components/landing/mobile-nav"
import { FeatureCard } from "@/components/landing/feature-card"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col w-full bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/95">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/prismalogo.png" alt="PRISMA AMBIENTAL Logo" width={50} height={50} className="rounded" />
            <h3 className="text-1xl font-bold text-[#003C2C]">PRISMA AMBIENTAL</h3> 
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#plataforma"
              className="text-sm font-medium text-slate-700 hover:text-[#003C2C] transition-colors"
            >
              Plataforma
            </Link>
            <Link
              href="#recursos"
              className="text-sm font-medium text-slate-700 hover:text-[#003C2C] transition-colors"
            >
              Recursos
            </Link>
            <Link href="#casos" className="text-sm font-medium text-slate-700 hover:text-[#003C2C] transition-colors">
              Casos de Uso
            </Link>
            <Link href="#contato" className="text-sm font-medium text-slate-700 hover:text-[#003C2C] transition-colors">
              Contato
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="hidden md:flex text-slate-700 hover:text-[#003C2C]">
                Entrar
              </Button>
            </Link>
            <Button className="hidden md:flex bg-[#003C2C] hover:bg-[#003C2C]/90">Solicitar Demo</Button>
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white">
            <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=800')] opacity-5"></div>
          </div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col space-y-8">
                <div className="space-y-6">
                  <Badge variant="outline" className="w-fit border-[#003C2C]/20 text-[#003C2C] bg-[#003C2C]/5">
                    <Satellite className="w-3 h-3 mr-2" />
                    Inteligência Geoespacial Avançada
                  </Badge>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                    Monitoramento
                    <span className="text-[#003C2C] block">Ambiental</span>
                    <span className="text-slate-600 block text-3xl md:text-4xl lg:text-5xl font-normal">
                      Inteligente
                    </span>
                  </h1>

                  <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
                    Plataforma integrada para análise de dados geoespaciais, monitoramento de desmatamento, focos de
                    incêndio e gestão de ações ambientais em tempo real.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-[#003C2C] hover:bg-[#003C2C]/90 text-white px-8">
                    Solicitar Demonstração
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 px-8"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Ver Plataforma
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center gap-8 pt-8 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Dados em tempo real
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Shield className="h-4 w-4 text-green-600" />
                    Segurança empresarial
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Award className="h-4 w-4 text-green-600" />
                    Certificado ISO
                  </div>
                </div>
              </div>

              {/* Dashboard Preview */}
              <div className="relative">
                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <div className="ml-4 text-sm text-slate-600">PRISMA Dashboard</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <Image
                      src="/placeholder.svg?height=400&width=600"
                      alt="PRISMA Dashboard Preview"
                      width={600}
                      height={400}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                </div>

                {/* Floating Stats */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">98.7%</div>
                      <div className="text-xs text-slate-600">Precisão</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">24/7</div>
                      <div className="text-xs text-slate-600">Monitoramento</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Overview */}
        <section id="plataforma" className="w-full py-20 bg-slate-50">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-6 mb-16">
              <Badge variant="outline" className="border-[#003C2C]/20 text-[#003C2C] bg-white">
                Plataforma Integrada
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Tecnologia de ponta para
                <span className="text-[#003C2C] block">decisões ambientais precisas</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Combine dados de satélite, sensores IoT e análises preditivas em uma única plataforma para monitoramento
                ambiental completo e tomada de decisão baseada em evidências.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                    <Satellite className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Dados Satelitais</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Integração com múltiplas fontes de dados satelitais para monitoramento de desmatamento, queimadas e
                    mudanças na cobertura vegetal.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Analytics Avançado</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Algoritmos de machine learning para análise preditiva e identificação de padrões em dados ambientais
                    complexos.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                    <Monitor className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Dashboards Interativos</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Visualizações dinâmicas e personalizáveis para diferentes níveis organizacionais e necessidades de
                    monitoramento.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="recursos" className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-6 mb-16">
              <Badge variant="outline" className="border-[#003C2C]/20 text-[#003C2C] bg-[#003C2C]/5">
                Recursos Avançados
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Ferramentas profissionais para
                <span className="text-[#003C2C] block">gestão ambiental eficiente</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                title="Mapeamento Geoespacial"
                description="Visualização avançada de dados georeferenciados com camadas personalizáveis e análise espacial em tempo real."
                icon="MapPin"
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              />
              <FeatureCard
                title="Gestão de Camadas"
                description="Controle total sobre camadas de dados com filtros avançados, sobreposições e análises comparativas."
                icon="Layers"
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              />
              <FeatureCard
                title="Análise Preditiva"
                description="Algoritmos de IA para previsão de riscos ambientais e otimização de estratégias de conservação."
                icon="TrendingUp"
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              />
              <FeatureCard
                title="Gestão de Dados"
                description="Plataforma robusta para armazenamento, processamento e análise de grandes volumes de dados ambientais."
                icon="Database"
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              />
              <FeatureCard
                title="Relatórios Executivos"
                description="Geração automatizada de relatórios personalizados com insights acionáveis para tomada de decisão."
                icon="FileText"
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              />
              <FeatureCard
                title="Segurança Empresarial"
                description="Controles de acesso granulares, criptografia de dados e conformidade com padrões de segurança."
                icon="Lock"
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              />
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section id="casos" className="w-full py-20 bg-slate-50">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-6 mb-16">
              <Badge variant="outline" className="border-[#003C2C]/20 text-[#003C2C] bg-white">
                Casos de Uso
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Soluções para diferentes
                <span className="text-[#003C2C] block">necessidades organizacionais</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Órgãos Governamentais</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Monitoramento de políticas públicas ambientais, fiscalização de áreas protegidas e coordenação
                        de ações de preservação em escala regional.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">ONGs e Institutos</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Gestão de projetos de conservação, monitoramento de biodiversidade e relatórios de impacto para
                        doadores e stakeholders.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Zap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Empresas Privadas</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Compliance ambiental, gestão de riscos ESG e monitoramento de impactos ambientais de operações
                        industriais.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Image
                  src="/placeholder.svg?height=500&width=600"
                  alt="Casos de Uso PRISMA"
                  width={600}
                  height={500}
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        {/* <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-6 mb-16">
              <Badge variant="outline" className="border-[#003C2C]/20 text-[#003C2C] bg-[#003C2C]/5">
                Depoimentos
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Confiança de organizações
                <span className="text-[#003C2C] block">líderes em sustentabilidade</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <TestimonialCard
                quote="A PRISMA revolucionou nossa capacidade de monitoramento. Reduzimos o tempo de resposta a incidentes ambientais em 60% e melhoramos significativamente nossa eficiência operacional."
                author="Dr. Carlos Mendes"
                role="Diretor de Monitoramento, IBAMA"
                avatarSrc="/placeholder.svg?height=60&width=60"
                className="border-0 shadow-lg"
              />
              <TestimonialCard
                quote="A plataforma oferece insights que antes eram impossíveis de obter. Nossa equipe consegue tomar decisões mais informadas e estratégicas para a conservação da Amazônia."
                author="Ana Oliveira"
                role="Coordenadora Científica, WWF Brasil"
                avatarSrc="/placeholder.svg?height=60&width=60"
                className="border-0 shadow-lg"
              />
              <TestimonialCard
                quote="Implementamos a PRISMA em nossas operações e conseguimos melhorar nossos indicadores ESG de forma mensurável. A ferramenta é essencial para nossa estratégia de sustentabilidade."
                author="Roberto Santos"
                role="Gerente de Sustentabilidade, Vale"
                avatarSrc="/placeholder.svg?height=60&width=60"
                className="border-0 shadow-lg"
              />
            </div>
          </div>
        </section> */}

        {/* CTA Section */}
        <section
          id="contato"
          className="w-full py-20 bg-gradient-to-br from-[#003C2C] to-[#478D4F] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=800')] opacity-10"></div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Pronto para transformar sua
                <span className="block">gestão ambiental?</span>
              </h2>
              <p className="text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
                Junte-se a organizações líderes que confiam na PRISMA para monitoramento ambiental inteligente e tomada
                de decisão baseada em dados.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="bg-white text-[#003C2C] hover:bg-white/90 px-8">
                  Solicitar Demonstração
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 hover:bg-white/10 px-8">
                  Falar com Especialista
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-8 pt-12 border-t border-white/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">24/7</div>
                  <div className="text-white/80">Suporte Técnico</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">99.9%</div>
                  <div className="text-white/80">Uptime Garantido</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">ISO 27001</div>
                  <div className="text-white/80">Certificação</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t bg-slate-900 text-white pt-10">
        <div className="container px-4 md:px-6 py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-6">
             
              <p className="text-slate-300 leading-relaxed">
                Plataforma líder em inteligência geoespacial para monitoramento ambiental e tomada de decisão baseada em
                dados.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Linkedin className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Github className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Plataforma</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Integrações
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                    API
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Segurança
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Recursos</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Documentação
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Centro de Ajuda
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Webinars
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Empresa</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Carreiras
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Imprensa
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-slate-300 hover:text-white transition-colors">
                    Contato
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} PRISMA AMBIENTAL. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                Privacidade
              </Link>
              <Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                Termos
              </Link>
              <Link href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
