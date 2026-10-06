
Com certeza! Aqui está a estrutura da sua arquitetura core organizada em formato Markdown, com as devidas referências aos arquivos do projeto:

🏗️ Arquitetura Core
O projeto é uma aplicação Next.js 15 (App Router) utilizando TypeScript, hospedada com banco PostgreSQL (Supabase) e gerenciada via Drizzle ORM.

1. Camada de Dados (Database & ORM)
A base de toda a aplicação. Define a estrutura das tabelas no schema rio_da_prata.

Arquivo Principal: db/schema.ts.

Principais Entidades: acoes, bacia_rio_da_prata, trilhas, waypoints, raw_firms (focos de incêndio), propriedades, entre outras.

Configuração: drizzle.config.ts.

2. Camada de Acesso a Dados (Repository Pattern)
Abstração para comunicação com o banco de dados.

Localização: lib/repositories.

Exemplos: acoesRepository.ts, mapLayerRepository.ts, firmsRepository.ts, dequeRepository.ts.

3. Camada de Lógica de Negócio (Services)
Onde as regras de negócio são processadas antes ou depois de salvar os dados.

Localização: lib/service.

Função: Interage com os repositórios e prepara os dados para a API ou Frontend.

4. API (Backend)
Rotas da API que expõem os dados para o frontend.

Localização: app/api.

Endpoints Chave: api/acoes, api/mapLayers, api/gpx, api/fogo, api/desmatamento.

5. Core do Frontend (Mapa e Dashboard)
O coração visual da aplicação "Sala de Situação".

Mapa: components/map/map.tsx (Implementação do Leaflet).

Gerenciamento de Camadas: components/map/ActionLayerCard.tsx e components/map/MapLayerCard.tsx.

Página Principal: app/page.tsx (Dashboard principal).

6. Bibliotecas Base e Configurações
UI: Tailwind CSS + ShadcnUI (localizado em components/ui).

Autenticação/Cliente: Supabase (localizado em utils/supabase).

Configuração: package.json, next.config.ts e tsconfig.json.


Schema do banco de dados: https://gemini.google.com/share/e71dd66e1578

7. Documentação de Design
Para padrões visuais, paleta de cores e guias de estilo, consulte o [DESIGN.md](DESIGN.md), que reúne as decisões e os motivos de cada uma.

8. Regras de Segurança (SECURITY RULES)
> [!IMPORTANT]
> Estas regras devem ser seguidas rigosamente em todo o desenvolvimento.

*   **Tratamento de Erros no Backend:** NUNCA exponha mensagens de erro do banco de dados (SQL, nomes de tabelas, nomes de colunas) para o cliente (frontend).
    *   **Correto:** `return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })` e logar o erro real com `console.error` no servidor.
    *   **Incorreto:** `return NextResponse.json({ error: error.message }, { status: 500 })`
*   **Validação de Input:** Sempre valide e sanitize inputs antes de usá-los em queries.
*   **Privacidade:** Não exponha dados sensíveis (CPFs, telefones pessoais) em rotas públicas ou desprotegidas.