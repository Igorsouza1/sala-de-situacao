# 🏛️ PRISMA — Architecture Review Report

**Data:** 8 de abril de 2026  
**Escopo:** Auditoria arquitetural para unificação SaaS B2B/B2G Multi-tenant  
**Sistemas Avaliados:**
- **Sistema A (Prefeitura):** PRISMA — Next.js + PostgreSQL/PostGIS (Supabase)
- **Sistema B (Instituição Privada):** React + FastAPI + PostgreSQL/PostGIS (Local)

---

## Sumário Executivo

O PRISMA é uma aplicação Next.js 15 (App Router) funcional com uma base de código que já contempla germes de multi-tenancy (`regiao_id`, `organizations`, `user_access`), porém **nenhuma dessas estruturas é efetivamente utilizada** na camada de API. O sistema opera atualmente como **single-tenant de fato**, retornando dados de todas as regiões em quase todas as queries.

O banco local (Instituição Privada) revela **dívida técnica severa**: 24 schemas com tabelas redundantes, dados duplicados em schemas separados (`rio_da_prata` vs `monitoramento`), e um total de **~5.8 GB**. O schema `monitoramento` (Drizzle) existe apenas no Supabase — não há equivalência local.

A fusão dos dois sistemas em um SaaS multi-tenant é **viável**, mas exige refatoração estrutural em 4 frentes críticas detalhadas abaixo.

---

## Pilar A: Estratégia Multi-Tenant e Banco de Dados

### A.1 — Diagnóstico do Estado Atual

#### Schema `monitoramento` (Supabase — Drizzle)

O schema Drizzle define 17 tabelas com estrutura coerente:

| Tabela | Possui `regiao_id` | Possui `geometry` | Observação |
|---|---|---|---|
| `acoes` | ✅ | ✅ (POINTZ) | Categoria, status, eixo temático |
| `trilhas` | ✅ | ✅ (MULTILINESTRINGZ) | FK para regioes |
| `waypoints` | ✅ | ✅ (POINTZ) | FK para trilhas + regioes |
| `regioes` | N/A (é a entidade raiz) | ✅ (MULTIPOLYGON) | Índice GiST presente |
| `organizations` | N/A | ❌ | UUID, `max_regions` |
| `user_access` | ✅ (FK) | ❌ | `user_id`, `organization_id`, `regiao_id`, `role` |
| `layer_catalog` | ✅ | ❌ | Slugs únicos, `schema_config`, `visual_config` |
| `layer_data` | ❌ (FK via `layer_id`) | ✅ (GEOMETRY genérico) | Índice GiST presente |
| `raw_firms` | ✅ | ✅ (POINT) | Índice B-tree composto (lat, lon, date, time) |
| `desmatamento` | ✅ | ✅ (GEOMETRY) | Sem índice espacial |
| `propriedades` | ✅ | ✅ (MULTIPOLYGON) | Sem índice espacial |
| `estradas` | ✅ | ✅ (MULTILINESTRINGZ) | Sem índice espacial |
| `destinatarios_alertas` | ✅ | ❌ | JSONB preferências |
| `fotos_acoes` | ❌ | ❌ | FK para acoes |
| `deque_de_pedras` | ❌ | ❌ | Sem vínculo regional |
| `balneario_municipal` | ❌ | ❌ | Sem vínculo regional |
| `ponte_do_cure` | ❌ | ❌ | Sem vínculo regional |
| `javali_avistamentos` | ❌ | ✅ (POINT) | Sem vínculo regional |

#### Banco Local (Instituição Privada) — 5.8 GB

O banco local apresenta **fragmentação severa de schemas**:

| Schema | Tabelas Relevantes | Problema |
|---|---|---|
| `public` | 16 tabelas com nomes soltos | Tabelas sem padronização (`"Torres_Pantera_Area_De_Monitoramento"`, `"zogue-zogue"`) |
| `rio_da_prata` | `acoes`, `desmatamento`, `propriedades`, `camadas`, `estradas` | **Dados duplicados** do schema `monitoramento` |
| `Fogo` | `fogo_2015` a `fogo_2023` (9 tabelas por ano) | **Particionamento manual** — deveria ser tabela única com índice por data |
| `Dados_Bruto_Desma_Fogo_Clima` | `desmatamento` | Duplicata adicional |
| `Rede_Amolar` | 6 tabelas geográficas | Dados de outra região, misturados |
| `RPPNS` | 3 tabelas | Dados de outra região, misturados |
| `Trilhas` | Trilhas soltas | Sem integração com `monitoramento.trilhas` |
| `firms`, `queimadas_inpe`, `firms_virss_noa20` | 3 schemas de focos | **Triplicação** de dados de focos de calor |
| `tiger`, `tiger_data`, `topology` | 60+ tabelas | Extensões PostGIS/Tiger — padrão, não problema |

### A.2 — Problemas Críticos Identificados

| # | Problema | Severidade | Impacto no SaaS |
|---|---|---|---|
| 1 | **Schema `monitoramento` não existe no banco local** | 🔴 CRÍTICA | Impossível migração direta — schemas são incompatíveis |
| 2 | **Tabelas duplicadas entre schemas** (`rio_da_prata.acoes` vs `monitoramento.acoes`) | 🔴 CRÍTICA | Risco de inconsistência de dados na migração |
| 3 | **Particionamento manual por ano** (`fogo_2015`..`fogo_2023`) | 🟠 ALTA | Queries precisam UNION ALL 9 tabelas; inviável para SaaS |
| 4 | **Triplicação de dados FIRMS** (3 schemas separados) | 🟠 ALTA | Mesma entidade em 3 locais diferentes |
| 5 | **Nomes de tabelas sem padrão** (`"zogue-zogue"`, `"Torres Pantera Ex"`) | 🟡 MÉDIA | Governança e manutenibilidade comprometidas |
| 6 | **Tabelas sem `regiao_id`** (`javali_avistamentos`, `balneario_municipal`, `deque_de_pedras`, `ponte_do_cure`) | 🟠 ALTA | Impossível isolamento multi-tenant sem alteração |
| 7 | **Índices GiST ausentes** em `desmatamento.geom`, `propriedades.geom`, `estradas.geom` | 🟠 ALTA | Degradação de performance em queries espaciais |
| 8 | **~5.8 GB de banco** sem Object Storage para raster | 🟡 MÉDIA | Custo de armazenamento e backup excessivo |

### A.3 — Proposta de Modelo Relacional Unificado Multi-Tenant

#### Princípios de Design

1. **Multi-tenancy via `tenant_id` + RLS:** Cada tabela de dados recebe `tenant_id UUID NOT NULL REFERENCES tenants(id)`. Row Level Security nativo do PostgreSQL garante isolamento.
2. **Hierarquia:** `tenants` → `regions` → dados. Um tenant pode ter múltiplas regiões (bacias, parques, etc.).
3. **Schema único:** Eliminar fragmentação. Um schema `pris` para todas as tabelas do produto.
4. **GeoJSON pesado → Object Storage:** Geometrias raster ou vetoriais massivas são armazenadas como arquivos `.geojson`/`.gpkg` no Azure Blob Storage / S3, com apenas metadados e bounding box no banco.

#### Modelo Proposto

```
┌───────────────────────────────────────────────┐
│ TENANTS (entidade raiz do SaaS)               │
├───────────────────────────────────────────────┤
│ id              UUID PK (gen_random_uuid())    │
│ name            VARCHAR(255) NOT NULL          │
│ slug            TEXT UNIQUE NOT NULL           │
│ plan            ENUM('free','pro','enterprise')│
│ max_regions     INT DEFAULT 1                  │
│ max_users       INT DEFAULT 5                  │
│ storage_quota_gb INT DEFAULT 10                │
│ created_at      TIMESTAMPTZ DEFAULT now()      │
│ updated_at      TIMESTAMPTZ DEFAULT now()      │
│ metadata        JSONB                          │
│ active          BOOLEAN DEFAULT true           │
└───────────────────────────────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────────┐
│ TENANT_USERS (usuários do SaaS)               │
├───────────────────────────────────────────────┤
│ id              UUID PK (FK → auth.users)     │
│ tenant_id       UUID NOT NULL FK → tenants    │
│ email           VARCHAR(255) NOT NULL          │
│ full_name       VARCHAR(255)                   │
│ created_at      TIMESTAMPTZ DEFAULT now()      │
└───────────────────────────────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────────┐
│ ROLES (RBAC nativo)                           │
├───────────────────────────────────────────────┤
│ id              SERIAL PK                      │
│ tenant_id       UUID FK → tenants              │
│ user_id         UUID FK → tenant_users         │
│ role            ENUM('admin','editor','viewer')│
│ region_id       INT FK → regions (nullable)    │
│ UNIQUE(tenant_id, user_id, region_id)          │
└───────────────────────────────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────────┐
│ REGIONS (regiões de monitoramento)            │
├───────────────────────────────────────────────┤
│ id              SERIAL PK                      │
│ tenant_id       UUID NOT NULL FK → tenants     │
│ name            VARCHAR(255) NOT NULL          │
│ slug            TEXT NOT NULL                  │
│ description     TEXT                           │
│ geom            GEOMETRY(MULTIPOLYGON, 4674)   │
│ color           TEXT                           │
│ metadata        JSONB                          │
│ created_at      TIMESTAMPTZ DEFAULT now()      │
│ updated_at      TIMESTAMPTZ DEFAULT now()      │
│ UNIQUE(tenant_id, slug)                        │
│ INDEX GiST (geom)                              │
└───────────────────────────────────────────────┘
```

**Tabelas de dados geoespacial** (todas com `tenant_id` + `region_id`):

```
┌──────────────────────────────────────────────────────────┐
│ ACOES / TRILHAS / WAYPOINTS / DESMATAMENTO / FIRMS /     │
│ PROPRIEDADES / ESTRADAS / LAYER_DATA / LAYER_CATALOG     │
├──────────────────────────────────────────────────────────┤
│ id              SERIAL PK                                 │
│ tenant_id       UUID NOT NULL FK → tenants                │
│ region_id       INT NOT NULL FK → regions                 │
│ ...colunas específicas da entidade...                     │
│ geom            GEOMETRY(..., 4674)                       │
│ properties      JSONB (genérico para campos customizados) │
│ created_at      TIMESTAMPTZ DEFAULT now()                 │
│                                                          │
│ INDEX GiST (geom)  — em todas as tabelas com geometria    │
│ INDEX btree (tenant_id, region_id, created_at)            │
│ INDEX btree (tenant_id, created_at) — para dashboards     │
└──────────────────────────────────────────────────────────┘
```

**Tabelas de domínio** (sem geometria, mas com `tenant_id`):

```
┌───────────────────────────────────────────────┐
│ BALNEARIO / DEQUE_PEDRAS / PONTE_DO_CURE /    │
│ JAVALI_AVISTAMENTOS / DESTINATARIOS_ALERTAS   │
├───────────────────────────────────────────────┤
│ id              SERIAL PK                      │
│ tenant_id       UUID NOT NULL FK → tenants     │
│ region_id       INT FK → regions (nullable)    │
│ ...colunas específicas...                      │
│ created_at      TIMESTAMPTZ DEFAULT now()      │
│ INDEX btree (tenant_id, region_id, created_at) │
└───────────────────────────────────────────────┘
```

### A.4 — Estratégia de RLS (Row Level Security)

```sql
-- Habilitar RLS no schema
ALTER TABLE pris.acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pris.regions ENABLE ROW LEVEL SECURITY;
-- ... repetir para todas as tabelas

-- Política padrão: usuário só vê dados do seu tenant
CREATE POLICY tenant_isolation ON pris.acoes
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Política para roles com escopo regional
CREATE POLICY region_scoped_access ON pris.acoes
  USING (
    EXISTS (
      SELECT 1 FROM pris.roles r
      WHERE r.user_id = auth.uid()
        AND r.tenant_id = pris.acoes.tenant_id
        AND (r.region_id IS NULL OR r.region_id = pris.acoes.region_id)
    )
  );
```

**Alternativa recomendada para Next.js + Drizzle:** Em vez de depender de `current_setting` (que exige `SET app.current_tenant` por conexão), injetar `tenant_id` via middleware no Drizzle:

```typescript
// lib/db/tenant-context.ts
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';

export function withTenant<T>(tenantId: string, queryFn: () => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.current_tenant = ${tenantId}`);
    return queryFn();
  });
}
```

Ou, mais seguro — **nunca confiar no cliente**: extrair `tenant_id` do JWT claims e aplicar como filtro obrigatório em todos os repositories:

```typescript
// Middleware de API — injeta tenant no request context
const tenantId = user.app_metadata.tenant_id;
const requestWithTenant = new NextRequest(request.url, {
  ...request,
  headers: new Headers([...request.headers, ['x-tenant-id', tenantId]]),
});
```

### A.5 — Recomendações Geoespaciais

| Ação | Prioridade | Detalhe |
|---|---|---|
| Criar índices GiST em `desmatamento.geom`, `propriedades.geom`, `estradas.geom` | 🔴 Imediata | `CREATE INDEX idx_desmatamento_geom ON pris.desmatamento USING gist(geom);` |
| Migrar focos de calor para tabela única com particionamento por data | 🟠 Alta | `PARTITION BY RANGE (acq_date)` — PostgreSQL nativo |
| Avaliar ST_AsMVT para tiles vetoriais | 🟡 Média | Para renderização eficiente no MapLibre |
| Migrar geometrias raster (>10MB) para Object Storage | 🟡 Média | Azure Blob (já integrado) com referência no banco |
| Adicionar índice GIN em `properties` JSONB | 🟡 Média | Para queries genéricas em camadas customizadas |

---

## Pilar B: Separação de Responsabilidades (Next.js vs. FastAPI)

### B.1 — Gargalos Identificados no Next.js

O Next.js atualmente executa operações que são **incompatíveis com ambiente serverless**:

| Rota | Operação | Payload Estimado | Risco Timeout |
|---|---|---|---|
| `/api/map/layers` | 7 queries paralelas com `ST_AsGeoJSON` | 5-50 MB JSON | 🔴 ALTO |
| `/api/admin/regions/[id]/commit-layer` | Batch de 500 features com `ST_SetSRID(ST_GeomFromGeoJSON)` | 10-100 MB | 🔴 ALTO |
| `/api/admin/regions/[id]/commit-union` | `ST_Union` de geometria da região + GeoJSON upload | 5-20 MB | 🔴 ALTO |
| `/api/admin/regions/preview-union` | `ST_Union` + retorno GeoJSON completo | 5-20 MB | 🔴 ALTO |
| `/api/admin/regions/[id]/commit-focos` | Loop N+1 com `ST_Equals` por feature | 1-50 MB | 🔴 ALTO |
| `/api/admin/regions/[id]/commit-properties` | Loop N+1 com `ST_Equals` | 1-50 MB | 🔴 ALTO |
| `/api/mapLayers/upload` | Chunks de 1000 features com `ST_Simplify(ST_MakeValid(...))` | 10-200 MB | 🔴 ALTO |
| `/api/desmatamento/route.ts` | Todos os dados agrupados por mês/ano | 1-10 MB | 🟠 MÉDIO |
| `/api/fogo/route.ts` | Todos os FIRMS com geometria | 1-10 MB | 🟠 MÉDIO |
| `/api/map/heatmap/fauna-exotica` | `ST_X/ST_Y` em todos os avistamentos | 1-5 MB | 🟡 BAIXO |

### B.2 — N+1 Queries Crítico

Em `/api/admin/regions/[id]/commit-focos`:
```typescript
// Para CADA feature no GeoJSON, faz uma query individual
for (const feature of features) {
  const existing = await db.execute(sql`
    SELECT id FROM monitoramento.layer_data 
    WHERE layer_id = ${layerId} 
    AND ST_Equals(geom, ST_SetSRID(ST_GeomFromGeoJSON(${geom}), 4674))
  `);
}
```
**Para 10.000 features = 10.000 queries sequenciais.** Mesmo com streaming NDJSON, a operação total leva minutos.

### B.3 — Plano de Separação

#### Next.js deve ser responsável por:
- ✅ Renderização de UI (páginas, componentes, dashboard)
- ✅ Autenticação e gerenciamento de sessão (Supabase Auth)
- ✅ Queries leves de leitura (dashboards, listagens, contagens)
- ✅ Geração de URLs assinadas para upload (Supabase Storage)
- ✅ Orquestração de chamadas ao FastAPI

#### FastAPI deve ser responsável por:
- ✅ Ingestão massiva de GeoJSON (commit-layer, commit-focos, commit-properties)
- ✅ Operações PostGIS pesadas (`ST_Union`, `ST_Intersects` em grandes volumes)
- ✅ Deduplicação geoespacial em larga escala
- ✅ Geração de tiles vetoriais (MVT) sob demanda
- ✅ Análises espaciais complexas (buffer, interseção, cálculo de área queimada)
- ✅ Sincronização FIRMS com NASA API (processamento assíncrono)

#### Contrato de Integração Next.js → FastAPI

```
┌─────────────┐     POST /api/v1/ingest/focos       ┌──────────────┐
│             │     Headers:                         │              │
│   Next.js   │       Authorization: Bearer <JWT>    │   FastAPI    │
│   (BFF)     │       X-Tenant-ID: <uuid>           │   (Geo API)  │
│             │     Body: GeoJSON (streaming)        │              │
└──────┬──────┘                                     └──────▲───────┘
       │                                                    │
       │ 1. Extrai tenant_id do JWT do usuário              │
       │ 2. Forward com service-to-service token            │
       │ 3. Poll status via task_id                         │
       │                                                    │
       └────────────────────────────────────────────────────┘
```

**Fluxo recomendado:**
1. Next.js autentica usuário, extrai `tenant_id` + `region_id` do JWT/session
2. Next.js faz POST ao FastAPI com `Authorization: Bearer <JWT_original>` + `X-Tenant-ID` + `X-Region-ID`
3. FastAPI valida o JWT (via JWKS do Supabase — sem precisar de shared secret)
4. FastAPI executa operação pesada e retorna `task_id`
5. Next.js poll `/api/v1/tasks/{task_id}/status` até conclusão
6. FastAPI notifica via webhook ou Server-Sent Events quando pronto

---

## Pilar C: Segurança e Isolamento de Contexto (Prevenção de IDOR)

### C.1 — Vulnerabilidades Mapeadas

| # | Vulnerabilidade | Severidade | Rotas Afetadas |
|---|---|---|---|
| 1 | **Sem autenticação em rotas admin** | 🔴 CRÍTICA | Todas `/api/admin/**` (~12 rotas) |
| 2 | **IDOR em todas as rotas com `[id]`** | 🔴 CRÍTICA | `acoes/[id]`, `propriedades/[id]`, `admin/**`, `layers/[slug]` (~20 rotas) |
| 3 | **Sem isolamento de tenant nas queries** | 🔴 CRÍTICA | Quase todas as rotas de leitura (`/api/map/**`, `/api/desmatamento/**`, `/api/fogo/**`) |
| 4 | **Upload de dados geoespaciais sem auth** | 🟠 ALTA | `mapLayers/upload`, `gpx/**`, `javali-avistamentos/report` |
| 5 | **SQL Injection potencial em commit-desmatamento** | 🟠 ALTA | `admin/regions/[id]/commit-desmatamento` usa `sql.raw()` com interpolação manual |
| 6 | **Região hardcoded (`REGION_ID = 1`)** | 🟡 MÉDIA | `alerts/recipients/**` |
| 7 | **Exposição de dados sensíveis via dossier** | 🟠 ALTA | `propriedades/[id]/dossie`, `acoes/[id]` |
| 8 | **`userAccessInMonitoramento` não é consultada** | 🟠 ALTA | Nenhuma rota verifica acesso do usuário a regiões |

### C.2 — Detalhamento das Vulnerabilidades Críticas

#### 2.1 IDOR — Insecure Direct Object Reference

**Exemplo concreto:**
```
GET /api/acoes/42           → Retorna a ação 42 SEM verificar se o usuário
                               pertence ao tenant/região dono da ação.

DELETE /api/admin/layers/7  → Deleta a camada 7 SEM verificar ownership.
                               Qualquer pessoa com o ID pode deletar.

GET /api/propriedades/99/dossie → Retorna dossier completo (dados sensíveis)
                                    de qualquer propriedade conhecida o ID.
```

**Root Cause:** Nenhuma rota (exceto `/api/user` e `/api/alerts/recipients/**`) chama `supabase.auth.getUser()`. Não há verificação de ownership ou permissão.

#### 2.2 SQL Injection em `commit-desmatamento`

```typescript
// CÓDIGO ATUAL — vulnerável
AND alertid = ANY(ARRAY[${sql.raw(
  alertidsNoArquivo.map((id) => `'${id.replace(/'/g, "''")}'`).join(",")
)}]::text[])
```

Embora tente escapar aspas simples, `sql.raw()` com construção manual é propenso a bypass. O correto:
```typescript
// CORRETO — array parametrizado
AND alertid = ANY(${sql.array(alertidsNoArquivo, 'text')})
```

#### 2.3 Ausência de RBAC

O sistema atual possui apenas 2 papéis: `"Admin"` e `"viewer"` (default). A tabela `userAccessInMonitoramento` tem campo `role` com default `'viewer'`, mas **não é consultada em nenhuma rota**. Para um SaaS B2B/B2G, é necessário no mínimo:

| Role | Permissões |
|---|---|
| `owner` | Gerencia tenant, billing, usuários |
| `admin` | CRUD completo em todas as regiões do tenant |
| `editor` | Cria/edita dados em regiões atribuídas |
| `viewer` | Apenas leitura em regiões atribuídas |
| `auditor` | Acesso a logs e histórico de mudanças |

### C.3 — Modelo de Ameaças

```
┌──────────────────────────────────────────────────────────┐
│                    Ameaças Identificadas                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  T1: Usuário do Tenant A acessa dados do Tenant B       │
│      → Vetor: Manipular ID em URL (/api/acoes/[id])     │
│      → Mitigação: RLS + validação de tenant no JWT       │
│                                                          │
│  T2: Usuário viewer executa ação de admin                │
│      → Vetor: POST direto em /api/admin/**               │
│      → Mitigação: Middleware de auth + verificação role  │
│                                                          │
│  T3: Injeção de dados em região alheia                   │
│      → Vetor: POST em commit-layer com region_id arbitrário│
│      → Mitigação: Validar region_id contra user_access   │
│                                                          │
│  T4: Exfiltração de dados via query sem filtro           │
│      → Vetor: GET /api/map/layers retorna TODOS os dados │
│      → Mitigação: WHERE tenant_id = current_tenant OBRIGATÓRIO│
│                                                          │
│  T5: Abuso de rota pública sem rate limit                │
│      → Vetor: POST /api/javali-avistamentos/report       │
│      → Mitigação: Rate limiting + CAPTCHA                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Pilar D: Performance de Renderização no Front-end

### D.1 — Estado Atual: Duas Engines Coexistentes

| Engine | Biblioteca | Onde | Performance |
|---|---|---|---|
| **Leaflet** | leaflet 1.9.4 + react-leaflet 5.0 | Mapa principal (`map.tsx`), dossiês, formulários | 🔴 SVG/DOM — limita com +500 features |
| **MapLibre GL** | maplibre-gl 5.19.0 + react-map-gl 8.1 | Admin (`region-map-preview.tsx`) | 🟢 WebGL — suporta +10.000 features |

### D.2 — Problemas de Performance no Leaflet (Mapa Principal)

| # | Problema | Impacto | Evidência |
|---|---|---|---|
| 1 | **Sem clusterização** | 🔴 CRÍTICO | Cada ponto = 1 `<CircleMarker>` no DOM. 500+ pontos = travamento |
| 2 | **Sem simplificação client-side** | 🟠 ALTO | Polígonos com milhares de vértices renderizados em resolução total |
| 3 | **Carregamento total no boot** | 🟠 ALTO | `getAllLayers()` busca TODAS as camadas via `Promise.allSettled` |
| 4 | **Re-render completa em atualização** | 🟡 MÉDIO | `dataVersion` muda → todos GeoJSON remontados via `componentKey` |
| 5 | **FaunaLocationsLayer itera sobre TODOS os pontos** | 🔴 CRÍTICO | `{data.map((point) => <CircleMarker />)}` — 1 componente React por ponto |
| 6 | **GeoJSON inteiro em memória** | 🟡 MÉDIO | Cada FeatureCollection no estado React — dezenas/centenas de MB |

### D.3 — Comparação Técnica: Leaflet vs. MapLibre GL

| Critério | Leaflet | MapLibre GL |
|---|---|---|
| Renderização | SVG/DOM | WebGL/Canvas |
| Features simultâneas | ~500 (antes de lag) | ~50.000+ |
| Clusterização nativa | ❌ (requer plugin) | ✅ (built-in com `cluster: true`) |
| Tiles vetoriais (MVT) | ❌ | ✅ |
| Simplificação por zoom | ❌ | ✅ (geojson-vt automático) |
| GPU acceleration | ❌ | ✅ |
| Curva de aprendizado | Baixa | Média |
| Estilo de mapas | Básico | Avançado (expressões de estilo) |
| Mobile performance | Regular | Bom |

### D.4 — Recomendação: Migrar Mapa Principal para MapLibre GL

**Justificativa:**
- O MapLibre GL já está integrado e funcional na rota `/admin`.
- O `react-map-gl` (wrapper React do MapLibre) já está nas dependências.
- A migração resolve 5 dos 6 problemas de performance identificados.

**Plano de Migração:**

| Fase | Ação | Esforço |
|---|---|---|
| 1 | Criar componente `MapLibreMap` com mesma API de `map.tsx` | 2-3 dias |
| 2 | Implementar tile vetorial (MVT) via `ST_AsMVT` no backend | 3-5 dias |
| 3 | Adicionar clusterização nativa (`cluster: true` no source) | 1 dia |
| 4 | Migrar camadas GeoJSON para Source/Layer pattern | 3-5 dias |
| 5 | Implementar simplificação adaptativa por zoom | 2 dias |
| 6 | Substituir `FaunaLocationsLayer` por Circle Layer no MapLibre | 1 dia |
| 7 | Deprecar e remover Leaflet | 1 dia |

**Alternativa intermediária** (se migração completa não for viável imediatamente):
- Adicionar `leaflet.markercluster` ao mapa principal
- Implementar lazy loading de camadas (buscar apenas quando ativadas)
- Adicionar `ST_Simplify` com tolerância baseada no zoom level atual

### D.5 — Otimizações Imediatas (independente da engine)

| Otimização | Implementação | Impacto |
|---|---|---|
| Lazy loading de camadas | Buscar camada apenas quando toggle é ativado | 🔴 ALTO — reduz payload inicial em 70-90% |
| Paginação no backend | `LIMIT/OFFSET` ou cursor-based em `getAllLayers()` | 🟠 ALTO |
| Caching server-side | `unstable_cache` do Next.js em services | 🟡 MÉDIO |
| Compressão GeoJSON | `gzip` no response + `Accept-Encoding` | 🟡 MÉDIO |
| Virtualização espacial | Renderizar apenas features na viewport | 🔴 ALTO — para grandes datasets |

---

## Plano de Ação — Ordem de Execução

### Fase 0: Fundação (Semana 1-2) — 🔴 Bloqueante

| # | Ação | Responsável | Entregável |
|---|---|---|---|
| 0.1 | Definir schema unificado `pris` com `tenant_id` em todas as tabelas | Backend + DBA | Migration Drizzle |
| 0.2 | Criar índices GiST ausentes (`desmatamento`, `propriedades`, `estradas`) | DBA | SQL executado |
| 0.3 | Implementar middleware de auth para TODAS as rotas API | Backend | `api-middleware.ts` |
| 0.4 | Adicionar `maxDuration` às rotas de ingestão massiva | Backend | Config em cada route |
| 0.5 | Corrigir SQL injection em `commit-desmatamento` | Backend | Patch imediato |

### Fase 1: Segurança (Semana 3-4) — 🔴 Crítica

| # | Ação | Responsável | Entregável |
|---|---|---|---|
| 1.1 | Implementar verificação de `tenant_id` em TODAS as queries de leitura | Backend | All repositories updated |
| 1.2 | Adicionar RBAC com 5 roles (`owner`, `admin`, `editor`, `viewer`, `auditor`) | Backend | Tabela `roles` + policies |
| 1.3 | Implementar verificação de ownership em rotas com `[id]` | Backend | Guard em cada route |
| 1.4 | Adicionar rate limiting em rotas públicas (`javali-avistamentos/report`) | Backend | Middleware |
| 1.5 | Auditar exposição de dados sensíveis em endpoints de dossier | Backend + Security | Report de dados expostos |

### Fase 2: Unificação do Banco (Semana 5-7) — 🟠 Alta

| # | Ação | Responsável | Entregável |
|---|---|---|---|
| 2.1 | ETL de dados do banco local → schema `pris` no Supabase | DBA + Backend | Script de migração |
| 2.2 | Consolidar tabelas `fogo_2015`-`fogo_2023` → tabela única particionada | DBA | Migration + validação |
| 2.3 | Consolidar schemas FIRMS triplicados → tabela única | DBA | Migration + validação |
| 2.4 | Adicionar `tenant_id` às tabelas sem vínculo regional | Backend | Migration |
| 2.5 | Habilitar RLS em todas as tabelas de dados | DBA | Policies criadas |
| 2.6 | Migrar geometrias raster pesadas para Object Storage | Backend + Infra | Azure Blob configurado |

### Fase 3: Separação Next.js ↔ FastAPI (Semana 8-10) — 🟡 Média

| # | Ação | Responsável | Entregável |
|---|---|---|---|
| 3.1 | Deploy do FastAPI na nuvem (container) | Infra | Endpoint ativo |
| 3.2 | Implementar validação JWT via JWKS do Supabase no FastAPI | Backend (Python) | Middleware FastAPI |
| 3.3 | Migrar rotas `commit-*` para FastAPI | Backend (Python + TS) | Endpoints FastAPI + proxies Next.js |
| 3.4 | Migrar operações `ST_Union` pesadas para FastAPI | Backend (Python) | Endpoint + proxy |
| 3.5 | Implementar sistema de tarefas assíncronas (task queue) | Backend (Python) | Celery/RQ configurado |
| 3.6 | Implementar polling/webhook para status de tarefas | Frontend + Backend | UI de progresso |

### Fase 4: Performance do Front-end (Semana 11-13) — 🟡 Média

| # | Ação | Responsável | Entregável |
|---|---|---|---|
| 4.1 | Implementar lazy loading de camadas no mapa principal | Frontend | Toggle com fetch on-demand |
| 4.2 | Migrar mapa principal de Leaflet para MapLibre GL | Frontend | Componente substituto |
| 4.3 | Implementar tiles vetoriais (MVT) no backend | Backend (FastAPI) | Endpoint `/tiles/{z}/{x}/{y}.pbf` |
| 4.4 | Adicionar clusterização nativa no MapLibre | Frontend | Config `cluster: true` |
| 4.5 | Implementar simplificação adaptativa por zoom | Backend + Frontend | `ST_Simplify` dinâmico |
| 4.6 | Deprecar e remover código Leaflet | Frontend | Cleanup |

### Fase 5: Produção SaaS (Semana 14-16) — 🟢 Go-live

| # | Ação | Responsável | Entregável |
|---|---|---|---|
| 5.1 | Implementar fluxo de onboarding de novos tenants | Backend + Frontend | UI + API |
| 5.2 | Configurar billing/planos (`free`, `pro`, `enterprise`) | Backend | Tabela `tenants` atualizada |
| 5.3 | Testes de carga com múltiplos tenants simultâneos | QA | Report de performance |
| 5.4 | Penetration test focado em IDOR e vazamento cross-tenant | Security | Report |
| 5.5 | Deploy em produção com blue-green deployment | Infra | Go-live |

---

## Apêndice A: Resumo Numérico

| Métrica | Valor Atual | Meta Pós-Migração |
|---|---|---|
| Schemas no banco | 24 (fragmentados) | 1 (`pris`) |
| Tabelas de focos de calor | 3 schemas, 11 tabelas | 1 tabela particionada |
| Tabelas duplicadas | ~8 | 0 |
| Rotas sem autenticação | ~50 de 62 | 0 |
| Queries sem filtro de tenant | ~90% | 100% com filtro |
| Engine de mapa principal | Leaflet (DOM/SVG) | MapLibre GL (WebGL) |
| Features renderizáveis sem lag | ~500 | ~50.000+ |
| Timeout em rotas de ingestão | Sem config | `maxDuration` configurado |
| N+1 queries em loops | 2 rotas críticas | 0 (batch/CTE) |
| SQL injection vulnerabilidades | 1 confirmada | 0 |
| RBAC roles | 2 (Admin/viewer) | 5 (owner/admin/editor/viewer/auditor) |
| Tamanho do banco | ~5.8 GB | ~3 GB (+Object Storage) |

---

## Apêndice B: Stack Tecnológica Atual

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | Next.js (App Router) | 15.5.8 |
| UI Library | React | 19.0.0 |
| Styling | Tailwind CSS + ShadcnUI | 3.17 / latest |
| Map Engine 1 | Leaflet + react-leaflet | 1.9.4 / 5.0.0 |
| Map Engine 2 | MapLibre GL + react-map-gl | 5.19.0 / 8.1.0 |
| ORM | Drizzle ORM | 0.44.2 |
| Database (Cloud) | PostgreSQL/PostGIS (Supabase) | — |
| Database (Local) | PostgreSQL/PostGIS (local) | — |
| Auth | Supabase Auth (@supabase/ssr) | latest |
| Storage | Azure Blob Storage | @azure/storage-blob 12.27.0 |
| Geo Libraries | @turf/turf, @tmcw/togeojson | 7.3.3 / 7.1.2 |
| Validação | Zod | 4.0.17 |
| Testes | Jest | 30.2.0 |

---

## Conclusão

O PRISMA possui uma base de código funcional com **germes de multi-tenancy não implementados**. A fusão dos dois sistemas em um SaaS é viável, mas exige:

1. **Unificação do schema de banco** (eliminar fragmentação de 24 schemas para 1)
2. **Implementação real de isolamento cross-tenant** (RLS + middleware de auth)
3. **Delegação de processamento pesado ao FastAPI** (sair do ambiente serverless para operações PostGIS pesadas)
4. **Migração do mapa principal para MapLibre GL** (resolver gargalos de renderização)

A ordem recomendada é: **Segurança → Banco → Separação de responsabilidades → Performance → Go-live**. Inverter essa ordem cria risco de vazamento de dados entre tenants ou retrabalho significativo.

---

*Documento gerado automaticamente como parte do Architecture Review do PRISMA.*  
*Para dúvidas ou esclarecimentos, solicitar análise detalhada de qualquer seção.*
