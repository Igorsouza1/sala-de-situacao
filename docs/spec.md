# PRISMA — Especificação de Refatoração Arquitetural
**Versão:** 1.0  
**Data:** 13 de abril de 2026  
**Baseada em:** `auditoria-arquitetural-PRISMA.md`  
**Status:** Draft para aprovação

---

## Visão Geral

O PRISMA é uma aplicação Next.js 15 de monitoramento geoespacial que precisa evoluir de um sistema **single-tenant de fato** para uma plataforma **SaaS B2B/B2G multi-tenant**. Esta especificação define os requisitos para os três pilares de refatoração identificados na auditoria.

---

## Pilar 1 — Multi-Tenancy Real

### Contexto

O schema atual possui as tabelas `organizations` e `user_access` no schema `monitoramento`, com campos `regiao_id` em várias tabelas. Porém:
- Nenhuma rota da API verifica `tenant_id` ou `organization_id`
- O middleware atual (`middleware.ts`) não aplica isolamento de tenant
- ~90% das queries retornam dados de todos os registros sem filtro de contexto
- `user_access` tem campo `role`, mas não é consultada em nenhuma rota

### Requisitos Funcionais

**RF-1.1 — Hierarquia de Identidade**
- O sistema deve suportar a hierarquia: `Tenant → Region → Data`
- Um tenant representa uma organização cliente (prefeitura, instituição privada, etc.)
- Um tenant pode ter múltiplas regiões de monitoramento
- Usuários são vinculados a tenants e podem ter escopo por região

**RF-1.2 — Isolamento de Dados**
- Todo dado de negócio deve pertencer a exatamente um `tenant_id`
- Nenhuma query de leitura pode retornar dados de outros tenants
- Operações de escrita devem validar que o `tenant_id` do payload corresponde ao tenant autenticado
- IDs de recursos não devem ser globalmente adivinhável (IDOR prevention)

**RF-1.3 — RBAC com 5 Roles**
| Role | Escopo | Permissões |
|---|---|---|
| `owner` | Tenant | CRUD total + gerência de usuários/billing |
| `admin` | Tenant | CRUD total em todas as regiões do tenant |
| `editor` | Região | Cria e edita dados nas regiões atribuídas |
| `viewer` | Região | Apenas leitura nas regiões atribuídas |
| `auditor` | Tenant | Acesso a logs e histórico (somente leitura) |

**RF-1.4 — Contexto de Tenant no Request**
- O `tenant_id` deve ser extraído do JWT (Supabase Auth `app_metadata`) — nunca confiado ao cliente
- Todas as rotas protegidas devem passar pelo middleware de autenticação
- Rotas com parâmetros `[id]` devem verificar ownership antes de operar

**RF-1.5 — Onboarding de Tenant**
- O sistema deve suportar criação de novos tenants via API de administração
- Cada tenant tem plano (`free`, `pro`, `enterprise`) com limites configuráveis: `max_regions`, `max_users`, `storage_quota_gb`

### Requisitos Não-Funcionais

**RNF-1.1** — A adição de `tenant_id` como filtro obrigatório não pode degradar queries existentes mais do que 10% com índices adequados  
**RNF-1.2** — Nenhum dado de tenant A deve ser visível para tenant B, mesmo com manipulação de URL  
**RNF-1.3** — A migração de dados existentes deve preservar 100% dos registros atuais vinculados ao tenant da Prefeitura (tenant de seed)

### Modelo de Dados Alvo

```
tenants
  id (UUID PK)
  name, slug (UNIQUE), plan
  max_regions, max_users, storage_quota_gb
  active, metadata (JSONB)

tenant_users
  id (UUID FK → auth.users)
  tenant_id (UUID FK → tenants)
  email, full_name

roles
  id (SERIAL PK)
  tenant_id (FK), user_id (FK), role (ENUM)
  region_id (FK → regions, nullable para escopo global no tenant)
  UNIQUE(tenant_id, user_id, region_id)

regions  [renomeia regioes]
  id (SERIAL PK)
  tenant_id (UUID NOT NULL FK → tenants)
  name, slug, geom, metadata (JSONB)
  UNIQUE(tenant_id, slug)
```

Todas as tabelas de dados recebem:
```sql
tenant_id UUID NOT NULL REFERENCES tenants(id)
-- INDEX btree (tenant_id, region_id, created_at)
```

### Estratégia de Implementação (sem quebrar o código atual)

- O campo `tenant_id` é adicionado como `NOT NULL DEFAULT <seed_tenant_uuid>` na migration
- O seed tenant é o tenant da Prefeitura/sistema atual
- Todos os dados existentes recebem o `seed_tenant_uuid` na migration
- A tabela `organizations` é **renomeada** para `tenants` (migration com alias temporário)
- `user_access` é **renomeada** para `roles` e recebe o campo `role` expandido
- O schema `monitoramento` é **mantido** — não há mudança de schema nesta fase

---

## Pilar 2 — Adaptabilidade a Qualquer Dado Espacial

### Contexto

O sistema atual tem duas abordagens coexistentes para camadas:
1. **Estática**: Entidades hardcoded (`acoes`, `estradas`, `desmatamento`, `firms`, `propriedades`) com repositórios e serviços dedicados
2. **Dinâmica**: Tabelas `layer_catalog` + `layer_data` com `schema_config` e `visual_config` JSONB

O `STATIC_STRATEGIES` em `layerService.ts` tem 5 entidades fixas. Para qualquer novo tipo de dado (ex: queimadas, nascentes, RPPN, fauna), é necessário criar repository + service + strategy + rota — alta fricção para extensão.

### Requisitos Funcionais

**RF-2.1 — Layer Catalog como fonte de verdade**
- Toda camada (estática ou dinâmica) deve ser cadastrada no `layer_catalog`
- O `schema_config` JSONB define: `{ sourceType, tableName, geometryColumn, filterColumns, dateColumn }`
- O `visual_config` JSONB define: `{ color, opacity, strokeWidth, iconType, clusterRadius }`
- O sistema resolve qual source usar com base no `sourceType`, não em código hardcoded

**RF-2.2 — Source Types suportados**
| sourceType | Descrição | Exemplo |
|---|---|---|
| `table` | Query direta em tabela do schema `monitoramento` | `acoes`, `estradas`, `propriedades` |
| `layer_data` | Query via `layer_id` na tabela `layer_data` | Camadas importadas via shapefile/GeoJSON |
| `mvt` | Endpoint de vector tiles (FastAPI) | Datasets grandes, +10k features |
| `static_file` | URL de arquivo GeoJSON/GeoPackage no Object Storage | Geometrias raster pesadas |
| `wms` | URL de serviço WMS externo | Imagens de satélite, ortomosaico |

**RF-2.3 — Adicionar nova camada sem código**
- Um admin deve poder cadastrar uma nova camada via painel de administração informando:
  - Nome, slug, descrição, ícone
  - `sourceType` + configuração correspondente
  - Configuração visual (cor, opacidade, ícone)
- O mapa deve renderizar a nova camada automaticamente sem deploy

**RF-2.4 — Filtros genéricos por camada**
- O `schema_config.filterColumns` lista colunas disponíveis para filtro (ex: `["categoria", "status", "data"]`)
- O frontend lê essa configuração para renderizar os controles de filtro dinamicamente
- Filtros de data, área e categoria são aplicados via parâmetros de query padrão

**RF-2.5 — Propriedades extras via JSONB**
- Tabelas de entidades específicas (`acoes`, `propriedades`) devem ter coluna `properties JSONB` para campos customizados por tenant
- Isso permite que tenant A adicione campo `"fazenda_cod"` e tenant B adicione `"bioma"` sem alterar o schema

**RF-2.6 — Upload de dados geoespaciais genérico**
- A rota de upload (`/api/mapLayers/upload`) deve aceitar qualquer GeoJSON/Shapefile e persistir no `layer_data` com `layer_id` correspondente
- O sistema deve inferir automaticamente o tipo de geometria e aplicar `ST_MakeValid`

### Requisitos Não-Funcionais

**RNF-2.1** — A camada de compatibilidade com as entidades hardcoded existentes deve ser transparente: o `STATIC_STRATEGIES` é refatorado para usar o mesmo código-caminho do `layer_catalog`  
**RNF-2.2** — `schema_config` e `visual_config` devem ter tipos TypeScript gerados automaticamente via Drizzle `InferInsertModel`  
**RNF-2.3** — A API `/api/map/layers` deve continuar funcionando com a mesma interface de resposta (`LayerResponseDTO[]`)

### Interface de Layer Catalog

```typescript
// types/layer-config.ts
type SourceType = 'table' | 'layer_data' | 'mvt' | 'static_file' | 'wms';

interface SchemaConfig {
  sourceType: SourceType;
  // Para sourceType = 'table'
  tableName?: string;
  geometryColumn?: string;
  filterColumns?: string[];
  dateColumn?: string;
  // Para sourceType = 'mvt'
  mvtEndpoint?: string;
  // Para sourceType = 'static_file' | 'wms'
  url?: string;
}

interface VisualConfig {
  color: string;
  opacity: number;
  strokeWidth?: number;
  iconType?: string;
  clusterRadius?: number;
  fillColor?: string;
  weight?: number;
}
```

---

## Pilar 3 — Performance via MapLibre GL

### Contexto

O mapa principal usa Leaflet 1.9.4 com renderização DOM/SVG. Com +500 features visíveis simultaneamente ocorre travamento. O MapLibre GL já está instalado e funcional na rota `/admin` via `react-map-gl`. O `FaunaLocationsLayer` cria 1 componente React por ponto.

### Requisitos Funcionais

**RF-3.1 — Migração do mapa principal para MapLibre GL**
- O componente `components/map/map.tsx` deve ser substituído por `MapLibreMap`
- A nova implementação deve aceitar os mesmos props externos que `map.tsx` expõe hoje
- O `GeoDataContext` existente deve continuar funcional durante a migração

**RF-3.2 — Lazy loading de camadas**
- Ao inicializar o mapa, nenhuma camada de dados deve ser carregada automaticamente
- Cada camada é carregada via fetch apenas quando o usuário ativa seu toggle
- O estado "visível" vs "dados carregados" deve ser gerenciado separadamente

**RF-3.3 — Clusterização nativa**
- Para camadas do tipo ponto (`acoes`, `firms`, `javali_avistamentos`), o MapLibre deve usar `cluster: true` no GeoJSON Source
- O `clusterRadius` deve ser configurável por camada via `visual_config`

**RF-3.4 — Vector Tiles (MVT) para datasets grandes**
- Camadas marcadas como `sourceType: 'mvt'` no catalog devem usar `VectorTileSource`
- O endpoint `/api/tiles/{slug}/{z}/{x}/{y}.pbf` deve ser implementado (retorna `ST_AsMVT` do PostGIS)
- Para `desmatamento`, `propriedades` e `estradas` (geometrias pesadas), usar MVT como padrão quando feature count > threshold configurável

**RF-3.5 — Simplificação adaptativa por zoom**
- Para camadas `sourceType: 'table'` e `sourceType: 'layer_data'`, o endpoint GeoJSON deve aceitar parâmetro `?zoom=N`
- O backend aplica `ST_Simplify` com tolerância inversamente proporcional ao zoom
- Zoom 8-10: tolerância alta (0.001) | Zoom 11-13: média (0.0005) | Zoom 14+: sem simplificação

**RF-3.6 — Viewport culling**
- O endpoint de layers deve aceitar parâmetros `bbox` (minLng,minLat,maxLng,maxLat)
- O backend filtra com `ST_Intersects(geom, ST_MakeEnvelope(...))` retornando apenas features na viewport

**RF-3.7 — Compatibilidade com funcionalidades existentes**
As seguintes funcionalidades devem ser mantidas na migração:
- Modal de detalhes ao clicar em feature
- Filtro por data (`DateFilterControl`)
- Filtro por área (`PropertyFilterControl`)
- Medidor de distância (`MeasureControl`)
- Inspetor de coordenadas (`CoordinateInspector`)
- Snapshot do mapa (`SnapshotControl`)
- Preview de GeoJSON (`ShapefileUploader`)
- Dossier de propriedades e ações
- Print do mapa (`MapPrintTemplate`)

### Requisitos Não-Funcionais

**RNF-3.1** — O mapa deve renderizar 10.000 pontos sem travamento (target: 60fps)  
**RNF-3.2** — O carregamento inicial do mapa não deve buscar dados de nenhuma camada (0 bytes de features no boot)  
**RNF-3.3** — A migração deve ser feita de forma **feature-flag**: o mapa Leaflet existente deve continuar funcional via env var `NEXT_PUBLIC_MAP_ENGINE=leaflet` até a migração estar completa  
**RNF-3.4** — O `react-map-gl` (já instalado) deve ser o wrapper React; não instalar nova biblioteca  

---

## Restrições Gerais

- **Zero breaking changes na API pública**: Os endpoints existentes (`/api/map/layers`, `/api/acoes`, etc.) devem manter a mesma interface de resposta
- **Migrations reversíveis**: Toda migration de banco deve ter `up` e `down` implementados
- **Feature flag de migração**: Cada pilar deve ter um feature flag de ativação para rollback seguro
- **Sem FastAPI nesta fase**: A separação Next.js ↔ FastAPI (Pilar B da auditoria) é **fora do escopo desta especificação**. Os endpoints MVT serão implementados como Route Handlers do Next.js com `maxDuration`
- **Banco único**: Manter schema `monitoramento` existente; não criar schema `pris` nesta fase

---

## Critérios de Aceitação Globais

| Critério | Métrica |
|---|---|
| Isolamento de tenant | 100% das queries com `WHERE tenant_id = $1` |
| Auth coverage | 100% das rotas `/api/**` com `supabase.auth.getUser()` |
| Mapa performance | 10.000 features sem lag (60fps no Chrome) |
| Carregamento inicial | Zero fetch de features no boot do mapa |
| Novas camadas | Admin adiciona camada sem deploy |
| Testes regressão | Todas as rotas existentes retornam HTTP 200 com dados corretos |
