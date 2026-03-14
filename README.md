# PRISMA - Monitoramento Geoespacial Inteligente

O **PRISMA (Sala de Situação)** é uma plataforma avançada de inteligência e monitoramento geoespacial voltada inicialmente para a tomada de decisões no **Município de Bonito-MS**. 

O sistema substitui processos manuais e lentos de recolhimento de dados espalhados, unificando informações críticas em um único painel. Através do cruzamento de dados geoespaciais e relatórios detalhados, o PRISMA capacita gestores ambientais, o IHP (Instituto Homem Pantaneiro) e as autoridades locais a proteger ativos naturais, monitorar incidentes e compreender o cenário ambiental em tempo real.

## 📌 Principais Funcionalidades e Domínios

O coração e diferencial do PRISMA é a capacidade de gerar cruzamento de informações e relatórios profundos orientados a propriedades rurais (através do Cadastro Ambiental Rural - CAR).

- **Dossiê de Propriedades (O Diferencial):** Geração de relatórios completos e consolidados de propriedades rurais. Cruza dados da propriedade com alertas de desmatamento, focos de incêndio, avistamento de animais, e mais, automatizando auditorias ambientais.
- **Painel de Controle e Dashboards:** Visão macro com gráficos sobre desmatamento, focos de incêndio (dados FIRMS) e atividades na região.
- **Alertas Ambientais:** Mapeamento em tempo real de pontos de desmatamento e Raw FIRMS (focos de calor/fogo via satélite). 
- **Monitoramento de Fauna (Javalis):** Registro estruturado de avistamentos de javalis, abordando uma grande dor ambiental e econômica do município de Bonito.
- **Estações de Monitoramento:** Integração com dados de qualidade da água e clima, como o *Deque de Pedras* (turbidez da água, secchi) e a *Ponte do Cure* (chuva, nível da água).
- **Ações, Fiscalizações e Trilhas:** Registro de incursões georreferenciadas. *(Nota: O mapeamento via arquivos GPX e roteamentos complexos de expedições estão sendo gradualmente descontinuados para manter o sistema ágil e focado).*

## 🛠 Arquitetura e Tecnologias

O PRISMA foi reconstruído para ser rápido, escalável e focado em alta complexidade geográfica.

- **Frontend & Backend:** [Next.js 15](https://nextjs.org/) (App Router, API Routes, Server Actions).
- **Banco de Dados Geoespacial:** [PostgreSQL](https://www.postgresql.org/) com extensão [PostGIS](https://postgis.net/) para consultas de raios, interseções e áreas.
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/), o que garante queries seguras (type-safe) e eficientes, especialmente nas geometrias complexas.
- **Mapas:** [Leaflet.js](https://leafletjs.com/) e/ou [MapLibre GL JS](https://maplibre.org/) operando os CustomLayers para exibir Shapes (GeoJSON), polígonos e marcações.
- **Autenticação & Funções Severless:** [Supabase](https://supabase.com/).
- **Storage:** Servidor de Arquivos da **Azure Blob Storage** para guarda de documentos e imagens vinculados às ações e propriedades.

## 🚀 Setup e Execução (Para Desenvolvedores)

Siga os passos abaixo para preparar seu ambiente de desenvolvimento local.

### 1. Variáveis de Ambiente (`.env.local`)
Você precisará das chaves dos serviços externos. Crie e preencha o `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=<sua_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_supabase_anon_key>
DATABASE_URL=<sua_database_url_postgresql_com_postgis>

AZURE_STORAGE_ACCOUNT_NAME=<sua_conta_azure>
AZURE_STORAGE_CONTAINER_NAME=<seu_container>
AZURE_STORAGE_ACCOUNT_KEY=<sua_chave_azure>
AZURE_STORAGE_CONNECTION_STRING=<sua_connection_string>
AZURE_STORAGE_BASE_URL=<url_base_blob>
```

### 2. Instalação e Execução

```bash
# 1. Instalar dependências
npm install
# ou
yarn install

# 2. Rodar migrações do Drizzle no banco (Garante a criação de todas as tabelas e Enums PostGIS)
npm run drizzle migrate
# ou
yarn drizzle migrate

# 3. Rodar o servidor de desenvolvimento
npm run dev
# ou
yarn dev
```

A aplicação subirá na porta `http://localhost:3000`.

## 🗺 Roadmap e Próximos Passos (Futuro)

O PRISMA está em constante evolução. O foco técnico e de produto atual engloba:

- **Turbinar o Dossiê de Propriedades:** Incorporar cruzamento de novos parâmetros (como dados fluviais próximos e análises ambientais mais robustas) no relatório do imóvel.
- **Integração de Estações Meteorológicas:** Adicionar módulos e gráficos específicos de estações climáticas para monitoramento do balanço hídrico e tempo.
- **Evolução de Dashboards:** Melhorar gráficos de análise (ex: Gráficos aprimões de Turbidez em Bonito) e tornar os dados mais interativos.
- **Alertas Escaláveis:** Estruturar sistemas de *Push/Email Notifications* para alertas automáticos de desmatamento e fogo ocorrendo em tempo real na nuvem.
- **Depreciação Guiada:** Limpar fluxos dependentes de arquivos legados (GPX soltos, fluxos de expedição antigos) consolidando tudo nas bases PostGIS principais.
