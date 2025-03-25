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
    <div className="flex min-h-screen flex-col w-full">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-orange-700">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/placeholder.svg?height=32&width=32"
              alt="Sala de Situação Logo"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="text-xl font-bold">Sala de Situação</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#recursos" className="text-sm font-medium hover:text-primary">
              Recursos
            </Link>
            <Link href="#depoimentos" className="text-sm font-medium hover:text-primary">
              Depoimentos
            </Link>
            <Link href="#planos" className="text-sm font-medium hover:text-primary">
              Planos
            </Link>
            <Link href="#contato" className="text-sm font-medium hover:text-primary">
              Contato
            </Link>
          </nav>

          <div className="flex items-center gap-4">
          <Link href="/sign-in">
              <Button variant="outline" className="hidden md:flex">
                Entrar
              </Button>
            </Link>
            <Button className="hidden md:flex">Cadastrar</Button>
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-6">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Monitoramento Geoespacial Inteligente
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Visualize e analise dados ambientais como desmatamento, incêndios e ações de preservação em uma única
                plataforma integrada.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-[hsl(var(--pantaneiro-lime))] text-primary-foreground hover:bg-[hsl(var(--pantaneiro-lime-hover))]"
                >
                  Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  Agendar Demonstração
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="recursos" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="inline-block rounded-full bg-[hsl(var(--pantaneiro-lime))] px-3 py-1 text-sm font-semibold text-primary-foreground">
                Recursos
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Tudo que você precisa para monitoramento ambiental
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
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
        <section id="depoimentos" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="inline-block rounded-full bg-[hsl(var(--pantaneiro-lime))] px-3 py-1 text-sm font-semibold text-primary-foreground">
                Depoimentos
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Utilizado por equipes de proteção ambiental
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
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
        <section id="planos" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="inline-block rounded-full bg-[hsl(var(--pantaneiro-lime))] px-3 py-1 text-sm font-semibold text-primary-foreground">
                Planos
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Preços simples e transparentes</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
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
        <section
          id="contato"
          className="w-full py-12 md:py-24 lg:py-32 bg-[hsl(var(--pantaneiro-green))] text-primary-foreground"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-4">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Pronto para transformar seu monitoramento ambiental?
              </h2>
              <p className="max-w-[700px] md:text-xl">
                Junte-se a dezenas de equipes que usam a Sala de Situação para monitorar e proteger o meio ambiente de
                forma eficiente.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Agendar Demonstração
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/placeholder.svg?height=32&width=32"
                  alt="Sala de Situação Logo"
                  width={32}
                  height={32}
                  className="rounded"
                />
                <span className="text-xl font-bold">Sala de Situação</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A plataforma completa para monitoramento geoespacial e análise de dados ambientais.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Produto</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Planos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Integrações
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Atualizações
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Recursos</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Documentação
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Guias
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Suporte
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Empresa</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Carreiras
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Termos
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Sala de Situação. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                Política de Privacidade
              </Link>
              <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                Termos de Serviço
              </Link>
              <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                Política de Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

