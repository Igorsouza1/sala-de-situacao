import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Twitter, Linkedin, Github, Facebook } from "lucide-react"
import { MobileNav } from "@/components/landing/mobile-nav"
import { PricingCard } from "@/components/landing/pricing-card"
import { TestimonialCard } from "@/components/landing/testimonial-card"
import { FeatureCard } from "@/components/landing/feature-card"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col w-full" style={{ backgroundColor: "#f8f5ed" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/10"
        style={{ backgroundColor: "#f8f5ed", borderColor: "#003C2C" }}
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/prismalogo.png"
              alt="PRISMA AMBIENTAL Logo"
              width={140}
              height={50}
              className="rounded"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#recursos" className="text-sm font-medium text-[#003C2C] hover:text-[#478D4F]">
              Recursos
            </Link>
            <Link href="#depoimentos" className="text-sm font-medium text-[#003C2C] hover:text-[#478D4F]">
              Depoimentos
            </Link>
            <Link href="#planos" className="text-sm font-medium text-[#003C2C] hover:text-[#478D4F]">
              Planos
            </Link>
            <Link href="#contato" className="text-sm font-medium text-[#003C2C] hover:text-[#478D4F]">
              Contato
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button
                variant="outline"
                className="hidden md:flex border-[#003C2C] text-[#003C2C] hover:bg-[#003C2C] hover:text-[#f8f5ed]"
              >
                Entrar
              </Button>
            </Link>
            <Button className="hidden md:flex bg-[#003C2C] text-[#f8f5ed] hover:bg-[#478D4F]">Cadastrar</Button>
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section with Background Image */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <Image src="/riodaprata.jpeg" alt="Background" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-black/60"></div>
          </div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="inline-block rounded-full bg-[#D2E5B0] px-3 py-1 text-sm font-semibold text-[#003C2C]">
                Monitoramento Inteligente
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-white">
                Monitoramento Geoespacial Inteligente
              </h1>
              <p className="max-w-[600px] text-white md:text-xl">
                Visualize e analise dados ambientais como desmatamento, incêndios e ações de preservação em uma única
                plataforma integrada.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-[#003C2C] text-white hover:bg-[#478D4F]">
                  Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-green-900 hover:bg-white hover:text-[#003C2C]"
                >
                  Agendar Demonstração
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="recursos" className="w-full py-12 md:py-24 lg:py-32" style={{ backgroundColor: "#f8f5ed" }}>
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="inline-block rounded-full bg-[#003C2C] px-3 py-1 text-sm font-semibold text-white">
                Recursos
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl text-[#003C2C]">
                Tudo que você precisa para monitoramento ambiental
              </h2>
              <p className="max-w-[700px] text-[#003C2C] md:text-xl">
                Nossa plataforma reúne em um só lugar dados de focos de incêndio, desmatamento e ações ambientais para
                que você tome decisões mais acertadas.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                title="Visualização Geoespacial"
                description="Visualize dados georeferenciados como pontos de ações, passivos ambientais e vestígios de crimes ambientais."
                icon="MapPin"
              />
              <FeatureCard
                title="Camadas Interativas"
                description="Exiba shapes, ações e pontos marcados no mapa com camadas personalizáveis e filtros avançados."
                icon="Layers"
              />
              <FeatureCard
                title="Dashboard Analítico"
                description="Acompanhe gráficos de fogo, desmatamento, chuva e nível do rio para análises completas."
                icon="BarChart2"
              />
              <FeatureCard
                title="Gestão de Dados"
                description="Gerencie tabelas geoespaciais com operações de inserção, edição e exclusão de forma simplificada."
                icon="Database"
              />
              <FeatureCard
                title="Relatórios Detalhados"
                description="Gere relatórios personalizados com dados filtrados por data, região ou tipo de ocorrência."
                icon="FileText"
              />
              <FeatureCard
                title="Segurança de Dados"
                description="Autenticação segura via Supabase e controle de acesso para diferentes níveis de usuários."
                icon="Shield"
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="depoimentos" className="w-full py-12 md:py-24 lg:py-32" style={{ backgroundColor: "#D2E5B0" }}>
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="inline-block rounded-full bg-[#003C2C] px-3 py-1 text-sm font-semibold text-white">
                Depoimentos
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl text-[#003C2C]">
                Utilizado por equipes de proteção ambiental
              </h2>
              <p className="max-w-[700px] text-[#003C2C] md:text-xl">
                Veja o que nossos usuários dizem sobre a Sala de Situação e como ela tem transformado o monitoramento
                ambiental.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <TestimonialCard
                quote="A Sala de Situação transformou nossa capacidade de monitoramento. Conseguimos identificar focos de incêndio 40% mais rápido."
                author="Carlos Mendes"
                role="Analista Ambiental, Instituto Florestal"
                avatarSrc="/placeholder.svg?height=40&width=40"
              />
              <TestimonialCard
                quote="A interface intuitiva e os recursos poderosos fazem da Sala de Situação a solução perfeita para nossa equipe de campo."
                author="Ana Oliveira"
                role="Coordenadora, Projeto Amazônia Viva"
                avatarSrc="/placeholder.svg?height=40&width=40"
              />
              <TestimonialCard
                quote="Já testamos várias ferramentas de monitoramento, mas a Sala de Situação é de longe a mais completa e fácil de usar."
                author="Roberto Santos"
                role="Diretor, Fundação Rio da Prata"
                avatarSrc="/placeholder.svg?height=40&width=40"
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="planos" className="w-full py-12 md:py-24 lg:py-32" style={{ backgroundColor: "#f8f5ed" }}>
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="inline-block rounded-full bg-[#003C2C] px-3 py-1 text-sm font-semibold text-white">
                Planos
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl text-[#003C2C]">
                Preços simples e transparentes
              </h2>
              <p className="max-w-[700px] text-[#003C2C] md:text-xl">
                Escolha o plano ideal para sua equipe. Todos os planos incluem um período de teste gratuito de 14 dias.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-3">
              <PricingCard
                title="Básico"
                price="R$499"
                description="Perfeito para pequenas equipes e projetos iniciais de monitoramento."
                features={["Até 5 usuários", "10 camadas de dados", "Relatórios básicos", "Suporte por email"]}
                buttonText="Iniciar Teste Gratuito"
                popular={false}
              />
              <PricingCard
                title="Profissional"
                price="R$999"
                description="Ideal para equipes em crescimento que precisam de mais recursos e flexibilidade."
                features={[
                  "Até 20 usuários",
                  "Camadas ilimitadas",
                  "Relatórios avançados",
                  "Suporte prioritário",
                  "Fluxos de trabalho personalizados",
                ]}
                buttonText="Iniciar Teste Gratuito"
                popular={true}
              />
              <PricingCard
                title="Empresarial"
                price="R$2.499"
                description="Para organizações com necessidades complexas e requisitos de segurança avançados."
                features={[
                  "Usuários ilimitados",
                  "Camadas ilimitadas",
                  "Segurança avançada",
                  "Gerente de conta dedicado",
                  "Integrações personalizadas",
                  "Garantias de SLA",
                ]}
                buttonText="Falar com Vendas"
                popular={false}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contato" className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden">
          {/* Background with gradient */}
          <div className="absolute inset-0" style={{ backgroundColor: "#478D4F" }}></div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center gap-4">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl text-white">
                Pronto para transformar seu monitoramento ambiental?
              </h2>
              <p className="max-w-[700px] text-white md:text-xl">
                Junte-se a dezenas de equipes que usam a Sala de Situação para monitorar e proteger o meio ambiente de
                forma eficiente.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-[#003C2C] text-white hover:bg-[#003C2C]/80">
                  Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-white border-white hover:bg-white hover:text-[#478D4F]"
                >
                  Agendar Demonstração
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-12" style={{ backgroundColor: "#003C2C", borderColor: "#478D4F" }}>
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-white p-2 rounded-md inline-block">
                <Image
                  src="/prismalogo.png"
                  alt="PRISMA AMBIENTAL Logo"
                  width={200}
                  height={60}
                  className="rounded"
                />
              </div>
              <p className="text-sm text-white">
                A plataforma completa para monitoramento geoespacial e análise de dados ambientais.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="text-[#D2E5B0] hover:text-white">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link href="#" className="text-[#D2E5B0] hover:text-white">
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
                <Link href="#" className="text-[#D2E5B0] hover:text-white">
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </Link>
                <Link href="#" className="text-[#D2E5B0] hover:text-white">
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[#D2E5B0]">Produto</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-white hover:text-[#D2E5B0]">
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-white hover:text-[#D2E5B0]">
                    Planos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-white hover:text-[#D2E5B0]">
                    Integrações
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-white hover:text-[#D2E5B0]">
                    Atualizações
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[#D2E5B0]">Recursos</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-white hover:text-[#D2E5B0]">
                    Documentação
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-white hover:text-[#D2E5B0]">
                    Guias
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-white hover:text-[#D2E5B0]">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-white hover:text-[#D2E5B0]">
                    Suporte
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[#D2E5B0]">Empresa</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-white hover:text-[#D2E5B0]">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-white hover:text-[#D2E5B0]">
                    Carreiras
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-white hover:text-[#D2E5B0]">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-white hover:text-[#D2E5B0]">
                    Termos
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div
            className="mt-8 border-t pt-8 flex flex-col md:flex-row justify-between items-center"
            style={{ borderColor: "#478D4F" }}
          >
            <p className="text-xs text-white">
              &copy; {new Date().getFullYear()} PRISMA AMBIENTAL. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="#" className="text-xs text-white hover:text-[#D2E5B0]">
                Política de Privacidade
              </Link>
              <Link href="#" className="text-xs text-white hover:text-[#D2E5B0]">
                Termos de Serviço
              </Link>
              <Link href="#" className="text-xs text-white hover:text-[#D2E5B0]">
                Política de Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

