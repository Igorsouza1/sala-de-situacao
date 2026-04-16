# PRISMA — Plano de Execução da Refatoração
**Versão:** 1.0  
**Data:** 13 de abril de 2026  
**Spec de referência:** `docs/spec.md`  
**Princípio guia:** Cada fase é deployável independentemente. O sistema deve funcionar em produção após cada passo.

---

## Regras de Ouro da Execução

1. **Expand-Contract Pattern**: Nunca deletar antes de criar o substituto
2. **Feature Flags**: `NEXT_PUBLIC_MAP_ENGINE`, `NEXT_PUBLIC_MULTI_TENANT` controlam ativação gradual
3. **Migration com default**: Novas colunas `NOT NULL` recebem `DEFAULT` para não quebrar dados existentes
4. **Testes antes de cada fase**: Rodar `jest` + checklist manual antes de avançar
5. **Rollback documentado**: Cada fase tem instrução de rollback explícita

---

## Fase 0 — Fundação de Segurança (Semana 1) 🔴 Bloqueante

> Corrige vulnerabilidades críticas que existem agora. Não altera estrutura de banco nem frontend.

### 0.1 — Corrigir SQL Injection imediato

**Arquivo:** `app/api/admin/regions/[id]/commit-desmatamento/route.ts`

Localizar o trecho com `sql.raw()` e substituir:
```typescript
// ANTES (vulnerável)
AND alertid = ANY(ARRAY[${sql.raw(alertidsNoArquivo.map(id => `'${id.replace(/'/g, "''")}'`).join(","))}]::text[])

// DEPOIS (seguro)
AND alertid = ANY(${sql.array(alertidsNoArquivo, 'text')})
```

**Teste:** Enviar payload com `' OR '1'='1` e verificar que a query falha com erro de validação, não retorna dados.

### 0.2 — Middleware de Auth em todas as rotas API

**Arquivo a criar:** `lib/api/require-auth.ts`
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, response: null };
}
```

**Aplicar em:** Todas as rotas `/api/admin/**` (12 rotas). Para cada `route.ts`:
```typescript
export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (response) return response;
  // ... resto do handler
}
```

**Prioridade por risco:**
1. `app/api/admin/**` — todas as rotas admin
2. `app/api/mapLayers/upload/route.ts`
3. `app/api/gpx/**`
4. `app/api/javali-avistamentos/report`

### 0.3 — Adicionar índices GiST ausentes

**Arquivo a criar:** `db/migrations/0001_gist_indexes.sql`
```sql
-- Executar diretamente no Supabase SQL Editor
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_desmatamento_geom 
  ON monitoramento.desmatamento USING gist(geom);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_propriedades_geom 
  ON monitoramento.propriedades USING gist(geom);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estradas_geom 
  ON monitoramento.estradas USING gist(geom);
```

**Nota:** `CONCURRENTLY` permite rodar sem lock na tabela.

### 0.4 — Adicionar `maxDuration` nas rotas pesadas

Adicionar em cada uma das rotas listadas na auditoria (B.1):
```typescript
export const maxDuration = 300; // 5 minutos
```

Arquivos: `commit-layer`, `commit-union`, `commit-focos`, `commit-properties`, `mapLayers/upload`

---

**Rollback Fase 0:** Cada item é independente. Revert de arquivo específico via git.  
**Critério de avanço:** Zero vulnerabilidades críticas abertas. Auth em todas as rotas admin.

---

## Fase 1 — Multi-Tenancy: Schema e Banco (Semana 2-3) 🔴

> Adiciona `tenant_id` ao banco sem quebrar a API existente.

### 1.1 — Criar tabela `tenants` (rename de `organizations`)

**Arquivo a criar:** `db/migrations/0002_tenants.ts` (Drizzle migration)

```typescript
// db/migrations/0002_tenants.ts
import { sql } from 'drizzle-orm';

export async function up(db) {
  // Renomear organizations → tenants
  await db.execute(sql`
    ALTER TABLE monitoramento.organizations 
    RENAME TO tenants;
  `);
  
  // Adicionar colunas faltantes
  await db.execute(sql`
    ALTER TABLE monitoramento.tenants
      ADD COLUMN IF NOT EXISTS slug TEXT,
      ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS max_users INT DEFAULT 5,
      ADD COLUMN IF NOT EXISTS storage_quota_gb INT DEFAULT 10,
      ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS metadata JSONB,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
    
    -- Seed: criar slug para tenant existente
    UPDATE monitoramento.tenants SET slug = id::text WHERE slug IS NULL;
    
    ALTER TABLE monitoramento.tenants
      ALTER COLUMN slug SET NOT NULL;
      
    ALTER TABLE monitoramento.tenants
      ADD CONSTRAINT tenants_slug_unique UNIQUE (slug);
  `);
}

export async function down(db) {
  await db.execute(sql`
    ALTER TABLE monitoramento.tenants RENAME TO organizations;
    -- Remover colunas adicionadas
    ALTER TABLE monitoramento.organizations 
      DROP COLUMN IF EXISTS slug,
      DROP COLUMN IF EXISTS plan,
      DROP COLUMN IF EXISTS max_users,
      DROP COLUMN IF EXISTS storage_quota_gb,
      DROP COLUMN IF EXISTS active,
      DROP COLUMN IF EXISTS metadata,
      DROP COLUMN IF EXISTS updated_at;
  `);
}
```

### 1.2 — Criar tabela `roles` (expand de `user_access`)

```sql
-- Manter user_access existente intacta (expand)
-- Criar nova tabela roles com a estrutura correta

CREATE TABLE monitoramento.roles (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES monitoramento.tenants(id),
  user_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer' 
    CHECK (role IN ('owner','admin','editor','viewer','auditor')),
  region_id INT REFERENCES monitoramento.regioes(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id, region_id)
);

-- Migrar dados de user_access → roles
INSERT INTO monitoramento.roles (tenant_id, user_id, role, region_id)
SELECT 
  ua.organization_id as tenant_id,
  ua.user_id,
  CASE WHEN ua.role = 'Admin' THEN 'admin' ELSE 'viewer' END as role,
  ua.regiao_id as region_id
FROM monitoramento.user_access ua;

CREATE INDEX idx_roles_tenant_user ON monitoramento.roles(tenant_id, user_id);
```

### 1.3 — Adicionar `tenant_id` nas tabelas de dados

**Estratégia:** `NOT NULL DEFAULT <seed_uuid>` — dados existentes ficam no tenant seed.

```sql
-- Obter o UUID do tenant seed (primeiro tenant existente)
-- Executar ANTES de rodar os ALTERs:
DO $$
DECLARE seed_tenant_id UUID;
BEGIN
  SELECT id INTO seed_tenant_id FROM monitoramento.tenants LIMIT 1;
  
  ALTER TABLE monitoramento.acoes ADD COLUMN IF NOT EXISTS 
    tenant_id UUID NOT NULL DEFAULT seed_tenant_id 
    REFERENCES monitoramento.tenants(id);
    
  ALTER TABLE monitoramento.trilhas ADD COLUMN IF NOT EXISTS 
    tenant_id UUID NOT NULL DEFAULT seed_tenant_id 
    REFERENCES monitoramento.tenants(id);
    
  ALTER TABLE monitoramento.waypoints ADD COLUMN IF NOT EXISTS 
    tenant_id UUID NOT NULL DEFAULT seed_tenant_id 
    REFERENCES monitoramento.tenants(id);
    
  ALTER TABLE monitoramento.desmatamento ADD COLUMN IF NOT EXISTS 
    tenant_id UUID NOT NULL DEFAULT seed_tenant_id 
    REFERENCES monitoramento.tenants(id);
    
  ALTER TABLE monitoramento.propriedades ADD COLUMN IF NOT EXISTS 
    tenant_id UUID NOT NULL DEFAULT seed_tenant_id 
    REFERENCES monitoramento.tenants(id);
    
  ALTER TABLE monitoramento.estradas ADD COLUMN IF NOT EXISTS 
    tenant_id UUID NOT NULL DEFAULT seed_tenant_id 
    REFERENCES monitoramento.tenants(id);
    
  ALTER TABLE monitoramento.raw_firms ADD COLUMN IF NOT EXISTS 
    tenant_id UUID NOT NULL DEFAULT seed_tenant_id 
    REFERENCES monitoramento.tenants(id);
    
  ALTER TABLE monitoramento.layer_catalog ADD COLUMN IF NOT EXISTS 
    tenant_id UUID NOT NULL DEFAULT seed_tenant_id 
    REFERENCES monitoramento.tenants(id);
    
  ALTER TABLE monitoramento.layer_data ADD COLUMN IF NOT EXISTS 
    tenant_id UUID NOT NULL DEFAULT seed_tenant_id 
    REFERENCES monitoramento.tenants(id);
    
  ALTER TABLE monitoramento.javali_avistamentos ADD COLUMN IF NOT EXISTS 
    tenant_id UUID NOT NULL DEFAULT seed_tenant_id 
    REFERENCES monitoramento.tenants(id);
    
  ALTER TABLE monitoramento.deque_de_pedras ADD COLUMN IF NOT EXISTS 
    tenant_id UUID NOT NULL DEFAULT seed_tenant_id 
    REFERENCES monitoramento.tenants(id);
    
  ALTER TABLE monitoramento.balneario_municipal ADD COLUMN IF NOT EXISTS 
    tenant_id UUID NOT NULL DEFAULT seed_tenant_id 
    REFERENCES monitoramento.tenants(id);

  ALTER TABLE monitoramento.ponte_do_cure ADD COLUMN IF NOT EXISTS 
    tenant_id UUID NOT NULL DEFAULT seed_tenant_id 
    REFERENCES monitoramento.tenants(id);
END $$;
```

### 1.4 — Criar índices compostos para performance

```sql
CREATE INDEX CONCURRENTLY idx_acoes_tenant_region 
  ON monitoramento.acoes(tenant_id, regiao_id, time DESC);

CREATE INDEX CONCURRENTLY idx_desmatamento_tenant_region 
  ON monitoramento.desmatamento(tenant_id, regiao_id);

CREATE INDEX CONCURRENTLY idx_layer_catalog_tenant 
  ON monitoramento.layer_catalog(tenant_id);

CREATE INDEX CONCURRENTLY idx_layer_data_tenant 
  ON monitoramento.layer_data(tenant_id);
```

### 1.5 — Atualizar `db/schema.ts`

Adicionar os novos campos ao schema Drizzle para manter sync com o banco:
- Adicionar `tenantId` em todas as tabelas afetadas
- Renomear referências de `organizations` para `tenants`
- Adicionar tabela `roles`

**Nota:** Esta etapa NÃO altera a API. As queries existentes ignoram o `tenant_id` novo por enquanto (será filtrado na Fase 2).

---

**Rollback Fase 1:** `ALTER TABLE ... DROP COLUMN tenant_id` em cada tabela. `DROP TABLE monitoramento.roles`. Renomear `tenants` de volta para `organizations`.  
**Critério de avanço:** Schema tem `tenant_id` em todas as tabelas. Seed tenant com dados existentes validado. API continua funcionando identicamente.

---

## Fase 2 — Multi-Tenancy: Contexto no Runtime (Semana 4-5) 🔴

> Ativa o isolamento real de tenant nas queries sem alterar a API response.

### 2.1 — Extrair tenant_id do JWT

**Arquivo a criar:** `lib/api/tenant-context.ts`
```typescript
import { User } from '@supabase/supabase-js';

export function extractTenantId(user: User): string | null {
  return user.app_metadata?.tenant_id ?? null;
}

export function requireTenantId(user: User): string {
  const tenantId = extractTenantId(user);
  if (!tenantId) throw new Error('User has no tenant association');
  return tenantId;
}
```

**Nota:** Para o tenant seed (usuário existente), o `app_metadata.tenant_id` precisa ser populado via Supabase Admin SDK uma vez durante o migration. Script: `scripts/seed-tenant-metadata.ts`

### 2.2 — Criar helper `requireAuth` com tenant

**Arquivo:** `lib/api/require-auth.ts` (expandir o criado na Fase 0)
```typescript
export async function requireAuthWithTenant() {
  const { user, response } = await requireAuth();
  if (!user) return { user: null, tenantId: null, response };
  
  const tenantId = extractTenantId(user);
  if (!tenantId) {
    return { 
      user, tenantId: null, 
      response: NextResponse.json({ error: 'No tenant' }, { status: 403 })
    };
  }
  return { user, tenantId, response: null };
}
```

### 2.3 — Atualizar repositories para aceitar `tenantId`

**Padrão de migração de repository:**
```typescript
// ANTES
export async function findAllAcoesDataWithGeometry(start?: Date, end?: Date) {
  return db.select()
    .from(acoesInMonitoramento)
    .where(/* filtros de data */);
}

// DEPOIS
export async function findAllAcoesDataWithGeometry(
  tenantId: string,
  start?: Date,
  end?: Date
) {
  return db.select()
    .from(acoesInMonitoramento)
    .where(and(
      eq(acoesInMonitoramento.tenantId, tenantId),
      /* filtros de data */
    ));
}
```

**Ordem de atualização dos repositories (por impacto):**
1. `acoesRepository.ts` — mais crítico (dossier expõe dados sensíveis)
2. `propriedadesRepository.ts` — dados sensíveis (proprietários)
3. `layerRepository.ts` — dados de tenant
4. `firmsRepository.ts`
5. `desmatamentoReposiroty.ts`
6. `estradasRepository.ts`
7. `mapLayerRepository.ts`
8. Restantes

### 2.4 — Atualizar services e rotas correspondentes

Para cada repository atualizado, atualizar o service e a rota de API correspondente:

```typescript
// app/api/map/layers/route.ts
export async function GET(request: NextRequest) {
  const { user, tenantId, response } = await requireAuthWithTenant();
  if (response) return response;
  
  // ... extrair params
  const layers = await getAllLayers(tenantId, startDate, endDate, minArea, maxArea);
  return NextResponse.json(layers);
}
```

### 2.5 — Implementar verificação de ownership em rotas `[id]`

**Helper:**
```typescript
// lib/api/verify-ownership.ts
export async function verifyAcaoOwnership(acaoId: number, tenantId: string) {
  const acao = await db.select({ id: acoesInMonitoramento.id })
    .from(acoesInMonitoramento)
    .where(and(
      eq(acoesInMonitoramento.id, acaoId),
      eq(acoesInMonitoramento.tenantId, tenantId)
    ))
    .limit(1);
  return acao.length > 0;
}
```

Aplicar em todas as rotas com `[id]` nos paths: `acoes/[id]`, `admin/layers/[slug]`, `propriedades/[id]`, etc.

### 2.6 — Feature Flag de Multi-Tenancy

```typescript
// lib/feature-flags.ts
export const FEATURES = {
  MULTI_TENANT: process.env.NEXT_PUBLIC_MULTI_TENANT === 'true',
  MAP_ENGINE: process.env.NEXT_PUBLIC_MAP_ENGINE ?? 'leaflet',
};
```

Com `NEXT_PUBLIC_MULTI_TENANT=false` (default), o `tenantId` usa o seed tenant e o comportamento atual é preservado. Ativar gradualmente por ambiente.

---

**Rollback Fase 2:** Setar `NEXT_PUBLIC_MULTI_TENANT=false`. Os repositories voltam ao código anterior via feature flag.  
**Critério de avanço:** 100% das queries com `WHERE tenant_id = $1`. Testes manuais: Usuário A não vê dados de Tenant B.

---

## Fase 3 — MapLibre Core: Engine Swap (Semana 6-7) 🟠

> Troca o engine de renderização de Leaflet para MapLibre GL, consumindo a mesma API GeoJSON
> existente. Nenhuma mudança no banco ou na API. Feature flag garante rollback imediato.
>
> **Por que antes do Catalog:** O `visual_config` do catalog precisa armazenar paint/layout JSON
> no formato MapLibre. Fazer o engine swap primeiro permite projetar o schema corretamente na
> Fase 4, sem precisar migrar dados depois.

### 3.1 — Instalar dependências MapLibre

```bash
npm install maplibre-gl react-map-gl
npm install --save-dev @types/maplibre-gl
```

Adicionar ao `next.config.js` (transpile necessário para react-map-gl):
```js
transpilePackages: ['react-map-gl', 'maplibre-gl'],
```

### 3.2 — Criar `MapLibreMap.tsx` paralelo ao Leaflet

**Arquivo a criar:** `components/map/MapLibreMap.tsx`

Consome a mesma API `/api/mapLayers` que o Leaflet usa hoje. Sem lazy loading ainda — isso vem
na Fase 5. O objetivo aqui é paridade visual.

```typescript
'use client';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useState } from 'react';

interface MapLibreMapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
}

export default function MapLibreMap({
  center = [-56.694734, -21.327773],
  zoom = 11,
}: MapLibreMapProps) {
  const [layers, setLayers] = useState<Record<string, GeoJSON.FeatureCollection>>({});

  useEffect(() => {
    fetch('/api/mapLayers')
      .then(r => r.json())
      .then(setLayers);
  }, []);

  return (
    <Map
      initialViewState={{ longitude: center[0], latitude: center[1], zoom }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="https://demotiles.maplibre.org/style.json"
    >
      <NavigationControl position="top-right" />
      {Object.entries(layers).map(([slug, data]) => (
        <Source key={slug} id={slug} type="geojson" data={data}>
          <Layer id={`${slug}-fill`} type="fill" paint={defaultPaint(slug)} />
        </Source>
      ))}
    </Map>
  );
}

function defaultPaint(slug: string) {
  // Mapeamento provisório até o Layer Catalog (Fase 4) fornecer visual_config real
  const palette: Record<string, string> = {
    acoes: '#f97316', estradas: '#6b7280', desmatamento: '#dc2626',
    raw_firms: '#f59e0b', propriedades: '#16a34a',
  };
  return { 'fill-color': palette[slug] ?? '#3b82f6', 'fill-opacity': 0.6 };
}
```

### 3.3 — Feature flag e entry point unificado

**Arquivo a criar:** `components/map/index.tsx`
```typescript
import { FEATURES } from '@/lib/feature-flags';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./map'), { ssr: false });
const MapLibreMap = dynamic(() => import('./MapLibreMap'), { ssr: false });

export default function Map(props: MapProps) {
  return FEATURES.MAP_ENGINE === 'maplibre'
    ? <MapLibreMap {...props} />
    : <LeafletMap {...props} />;
}
```

Atualizar `app/page.tsx` para importar de `@/components/map` ao invés de `@/components/map/map`.

`.env.local`:
```
NEXT_PUBLIC_MAP_ENGINE=maplibre   # trocar para leaflet para rollback
```

### 3.4 — Validação de paridade

Conferir visualmente com `NEXT_PUBLIC_MAP_ENGINE=maplibre` que todas as layers renderizam
corretamente. Não é necessário paridade de controles ainda (isso é Fase 5).

---

**Rollback Fase 3:** `NEXT_PUBLIC_MAP_ENGINE=leaflet` → Leaflet volta imediatamente. Nenhuma
mudança de banco ou API para desfazer.  
**Critério de avanço:** Todas as layers aparecem no MapLibre com cores corretas. Nenhuma regressão
com `MAP_ENGINE=leaflet`. Dataset real de desmatamento renderiza sem travar.

---

## Fase 4 — Layer Catalog Unificado (Semana 8-9) 🟠

> Refatora o sistema de camadas para ser data-driven, sem código hardcoded por entidade.
> Introduz hierarquia de escopo (tenant / region / global) e isola o código Leaflet do novo
> resolver — os dois engines operam em paralelo até a remoção do Leaflet na Fase 5.8.

### 4.0 — Garantia de Compatibilidade Dual-Engine

**Invariante desta fase:** o mapa Leaflet deve funcionar identicamente antes e depois de cada
passo. Qualquer quebra no Leaflet é um bug desta fase, não efeito colateral aceito.

**Separação de code paths:**

| | Leaflet | MapLibre |
|---|---|---|
| Endpoint de dados | `/api/mapLayers` (congelado — não tocar) | `/api/map/layers` (novo, catalog-driven) |
| Estilo visual | `STATIC_STRATEGIES` hardcoded (não tocar) | `visual_config.maplibre` do catalog |
| Ativação | `NEXT_PUBLIC_MAP_ENGINE=leaflet` | `NEXT_PUBLIC_MAP_ENGINE=maplibre` |

**Formato de `visual_config` — namespaced para suportar ambos os engines:**

```json
{
  "maplibre": {
    "type": "fill",
    "paint": { "fill-color": "#dc2626", "fill-opacity": 0.5 }
  },
  "leaflet": {
    "style": { "color": "#dc2626", "fillOpacity": 0.5, "weight": 1 }
  }
}
```

- O `MapLibreMap.tsx` lê exclusivamente `visual_config.maplibre`
- O Leaflet ignora `visual_config` por completo (usa `STATIC_STRATEGIES` até ser removido)
- Quando o Leaflet for removido na Fase 5.8, `visual_config.leaflet` vira campo morto — limpar
  em migração posterior sem urgência

**Regra:** nenhum arquivo Leaflet (`map.tsx`, `STATIC_STRATEGIES`, `/api/mapLayers`) é tocado
nesta fase. Se a mudança exige alterar esses arquivos, ela pertence à Fase 5.

---

### 4.1 — Adicionar coluna `scope` ao `layer_catalog`

```sql
ALTER TABLE monitoramento.layer_catalog
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'tenant'
  CHECK (scope IN ('tenant', 'region', 'global'));

COMMENT ON COLUMN monitoramento.layer_catalog.scope IS
  'tenant: filtrado por tenant_id | region: ST_Intersects com geom da região | global: sem filtro';
```

**Hierarquia de escopos:**

```
global ── sem filtro ──── limites de estados, municípios, biomas, hidrografia
  │
region ── ST_Intersects ─ propriedades (CAR), desmatamento, raw_firms, estradas
  │
tenant ── tenant_id ───── acoes, trilhas, avistamentos, layer_data (uploads)
```

---

### 4.2 — Seed dos slugs estáticos no catalog

`visual_config` usa o formato namespaced definido em 4.0. `schema_config` inclui o `scope`
correto para cada camada.

```sql
DO $$
DECLARE seed_tenant_id UUID;
BEGIN
  SELECT id INTO seed_tenant_id FROM monitoramento.tenants LIMIT 1;

  INSERT INTO monitoramento.layer_catalog
    (slug, name, tenant_id, scope, schema_config, visual_config, regiao_id)
  VALUES
    ('acoes', 'Ações', seed_tenant_id, 'tenant',
     '{"sourceType":"table","tableName":"acoes","geometryColumn":"geom","filterColumns":["categoria","status","eixo_tematico"],"dateColumn":"time"}'::jsonb,
     '{"maplibre":{"type":"circle","paint":{"circle-color":"#f97316","circle-radius":6,"circle-opacity":0.8},"cluster":{"enabled":true,"radius":50}},"leaflet":{"style":{"color":"#f97316","fillOpacity":0.8,"radius":6}}}'::jsonb,
     1),

    ('estradas', 'Estradas', seed_tenant_id, 'region',
     '{"sourceType":"table","tableName":"estradas","geometryColumn":"geom"}'::jsonb,
     '{"maplibre":{"type":"line","paint":{"line-color":"#6b7280","line-width":2,"line-opacity":0.7}},"leaflet":{"style":{"color":"#6b7280","weight":2,"opacity":0.7}}}'::jsonb,
     1),

    ('desmatamento', 'Desmatamento', seed_tenant_id, 'region',
     '{"sourceType":"table","tableName":"desmatamento","geometryColumn":"geom","filterColumns":["ano"],"dateColumn":"data"}'::jsonb,
     '{"maplibre":{"type":"fill","paint":{"fill-color":"#dc2626","fill-opacity":0.5,"fill-outline-color":"#fca5a5"}},"leaflet":{"style":{"color":"#dc2626","fillOpacity":0.5,"weight":1}}}'::jsonb,
     1),

    ('raw_firms', 'Focos de Calor', seed_tenant_id, 'region',
     '{"sourceType":"table","tableName":"raw_firms","geometryColumn":"geom","filterColumns":["satellite"],"dateColumn":"acq_date"}'::jsonb,
     '{"maplibre":{"type":"circle","paint":{"circle-color":"#f59e0b","circle-radius":5,"circle-opacity":0.9},"cluster":{"enabled":true,"radius":40}},"leaflet":{"style":{"color":"#f59e0b","fillOpacity":0.9,"radius":5}}}'::jsonb,
     1),

    ('propriedades', 'Propriedades', seed_tenant_id, 'region',
     '{"sourceType":"table","tableName":"propriedades","geometryColumn":"geom"}'::jsonb,
     '{"maplibre":{"type":"fill","paint":{"fill-color":"#16a34a","fill-opacity":0.4,"fill-outline-color":"#86efac"}},"leaflet":{"style":{"color":"#16a34a","fillOpacity":0.4,"weight":1}}}'::jsonb,
     1)

  ON CONFLICT (slug) DO UPDATE SET
    scope         = EXCLUDED.scope,
    schema_config = EXCLUDED.schema_config,
    visual_config = EXCLUDED.visual_config;
END $$;
```

---

### 4.3 — Criar resolver de camadas com tri-scope

**Arquivo a criar:** `lib/service/layer-resolver.ts`

O resolver aplica o filtro correto baseado no `scope` do catalog entry. `tableName` vem do
banco — nunca do request — mas ainda é validado contra whitelist para defesa em profundidade.

```typescript
import { db } from '@/db';
import { sql } from 'drizzle-orm';

type LayerScope = 'tenant' | 'region' | 'global';

interface SchemaConfig {
  sourceType: 'table' | 'layer_features' | 'layer_data';
  tableName?: string;
  geometryColumn?: string;
  dateColumn?: string;
  filterColumns?: string[];
}

interface ResolveOptions {
  tenantId: string;
  regiaoId?: number;
  startDate?: Date;
  endDate?: Date;
}

// Whitelist — tableName do catalog nunca vem do request, mas validamos em defesa
const ALLOWED_TABLES = new Set([
  'acoes', 'estradas', 'desmatamento', 'raw_firms',
  'propriedades', 'layer_data', 'layer_features',
]);

export async function resolveLayerData(
  schemaConfig: SchemaConfig,
  scope: LayerScope,
  options: ResolveOptions,
): Promise<GeoJSON.FeatureCollection> {
  switch (schemaConfig.sourceType) {
    case 'table':          return resolveTableLayer(schemaConfig, scope, options);
    case 'layer_features': return resolveLayerFeatures(schemaConfig, scope, options);
    case 'layer_data':     return resolveLayerDataSource(schemaConfig, options);
    default: throw new Error(`Unsupported sourceType: ${(schemaConfig as any).sourceType}`);
  }
}

async function resolveTableLayer(
  config: SchemaConfig,
  scope: LayerScope,
  options: ResolveOptions,
) {
  const { tableName, geometryColumn = 'geom', dateColumn } = config;
  const { tenantId, regiaoId, startDate, endDate } = options;

  if (!ALLOWED_TABLES.has(tableName!)) {
    throw new Error(`Table not allowed: ${tableName}`);
  }

  const scopeFilter = buildScopeFilter(scope, tenantId, regiaoId, geometryColumn, tableName!);
  const dateFilter = buildDateFilter(dateColumn, startDate, endDate);

  const result = await db.execute(sql`
    SELECT id, properties,
      ST_AsGeoJSON(${sql.identifier(geometryColumn)}) as geojson
    FROM monitoramento.${sql.identifier(tableName!)}
    WHERE ${scopeFilter} ${dateFilter}
  `);

  return toFeatureCollection(result.rows);
}

function buildScopeFilter(
  scope: LayerScope,
  tenantId: string,
  regiaoId: number | undefined,
  geometryColumn: string,
  tableName: string,
) {
  switch (scope) {
    case 'tenant':
      return sql`tenant_id = ${tenantId}`;

    case 'region':
      if (!regiaoId) throw new Error('regiaoId required for scope=region');
      // ST_Intersects usa o índice GiST — eficiente mesmo com datasets nacionais
      return sql`ST_Intersects(
        ${sql.identifier(geometryColumn)},
        (SELECT geom FROM monitoramento.regioes WHERE id = ${regiaoId})
      )`;

    case 'global':
      return sql`TRUE`; // sem filtro — dados de referência global
  }
}

function buildDateFilter(
  dateColumn: string | undefined,
  startDate: Date | undefined,
  endDate: Date | undefined,
) {
  if (!dateColumn) return sql``;
  const parts = [];
  if (startDate) parts.push(sql`AND ${sql.identifier(dateColumn)} >= ${startDate}`);
  if (endDate)   parts.push(sql`AND ${sql.identifier(dateColumn)} <= ${endDate}`);
  return parts.length ? sql.join(parts) : sql``;
}
```

---

### 4.4 — Nova API catalog-driven para MapLibre (isolada do Leaflet)

**Arquivo a criar:** `app/api/map/layers/route.ts`

Esta é uma **nova rota**, paralela à `/api/mapLayers` do Leaflet. O Leaflet continua usando
a rota existente sem alteração. O `MapLibreMap.tsx` é atualizado para usar esta nova rota.

```typescript
// app/api/map/layers/route.ts
export async function GET(request: NextRequest) {
  const { user, tenantId, response } = await requireAuthWithTenant();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const regiaoId = Number(searchParams.get('regiao_id') ?? 1);
  const startDate = searchParams.get('start') ? new Date(searchParams.get('start')!) : undefined;
  const endDate   = searchParams.get('end')   ? new Date(searchParams.get('end')!)   : undefined;

  const catalog = await getLayerCatalog(tenantId); // inclui entradas global e region

  const results = await Promise.allSettled(
    catalog.map(async (entry) => {
      const geoData = await resolveLayerData(
        entry.schemaConfig as SchemaConfig,
        entry.scope as LayerScope,
        { tenantId, regiaoId, startDate, endDate },
      );
      return {
        slug:         entry.slug,
        name:         entry.name,
        ordering:     entry.ordering,
        scope:        entry.scope,
        visualConfig: (entry.visualConfig as any)?.maplibre ?? entry.visualConfig,
        data:         geoData,
      };
    })
  );

  const layers = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<any>).value);

  return NextResponse.json(layers);
}
```

**Atualizar `MapLibreMap.tsx`** para consumir `/api/map/layers` ao invés de `/api/mapLayers`:
```typescript
// ANTES (Fase 3 — consumia endpoint Leaflet)
fetch('/api/mapLayers').then(r => r.json()).then(setLayers);

// DEPOIS (Fase 4 — endpoint catalog-driven)
fetch(`/api/map/layers?regiao_id=${regiaoId}`).then(r => r.json()).then(setLayers);
```

A resposta já inclui `visualConfig` no formato MapLibre — `<Layer>` recebe diretamente sem
tradução.

---

### 4.5 — Camadas globais via `layer_features`

Camadas de referência geográfica (limites de estados, municípios, biomas) vivem em
`layer_features` com uma entrada `scope: 'global'` no catalog. Isso permite que qualquer
tenant ative a camada sem duplicar dados.

**Estrutura:**
```
layer_catalog (scope='global', slug='estados') ──► layer_features (layer_id=X, geom=polígono MS)
layer_catalog (scope='global', slug='estados') ──► layer_features (layer_id=X, geom=polígono SP)
                                                        ↑ mesmos registros, todos os tenants
```

**Catalog entry para camada global (exemplo — executar quando importar o dado):**
```sql
INSERT INTO monitoramento.layer_catalog
  (slug, name, tenant_id, scope, schema_config, visual_config, regiao_id)
SELECT
  'estados', 'Limites Estaduais',
  id,  -- tenant que importou vira "dono" da configuração
  'global',
  '{"sourceType":"layer_features"}'::jsonb,
  '{"maplibre":{"type":"fill","paint":{"fill-color":"transparent","fill-outline-color":"#374151","fill-opacity":0.8}},"leaflet":{"style":{"color":"#374151","fill":false,"weight":1.5}}}'::jsonb,
  NULL  -- global não pertence a uma região específica
FROM monitoramento.tenants LIMIT 1
ON CONFLICT (slug) DO NOTHING;
```

**Importação:** manual via ShapefileUploader (já existente) — o upload popula `layer_features`
e cria o entry no catalog. Nenhuma automação nesta fase; a UI de import é Fase 5.

**Resolver para `layer_features`:**
```typescript
async function resolveLayerFeatures(
  config: SchemaConfig,
  scope: LayerScope,
  options: ResolveOptions,
) {
  // scope='global': retorna todas as features do layer_id
  // scope='region': filtra por ST_Intersects (p.ex. municípios dentro da região)
  const layerIdFilter = sql`lf.layer_id = (
    SELECT id FROM monitoramento.layer_catalog
    WHERE slug = ${config.slug} LIMIT 1
  )`;

  const spatialFilter = scope === 'region' && options.regiaoId
    ? sql`AND ST_Intersects(lf.geom, (SELECT geom FROM monitoramento.regioes WHERE id = ${options.regiaoId}))`
    : sql``;

  const result = await db.execute(sql`
    SELECT lf.id, lf.properties, ST_AsGeoJSON(lf.geom) as geojson
    FROM monitoramento.layer_features lf
    WHERE ${layerIdFilter} ${spatialFilter}
  `);

  return toFeatureCollection(result.rows);
}
```

---

### 4.6 — API CRUD para gerenciar layer catalog (admin)

**Arquivo a criar:** `app/api/admin/layer-catalog/route.ts`

```typescript
// GET    /api/admin/layer-catalog          — lista camadas do tenant (inclui global/region)
// POST   /api/admin/layer-catalog          — cria nova camada
// PUT    /api/admin/layer-catalog/[slug]   — atualiza visual_config, scope, ordering
// DELETE /api/admin/layer-catalog/[slug]   — remove (não permite deletar scope=global de outro tenant)
```

Validar no POST/PUT que `scope: 'global'` só pode ser criado por admin do tenant, e que o
`visual_config` contém pelo menos a chave `maplibre`.

---

### 4.7 — Adicionar `properties JSONB` nas tabelas de entidade

```sql
ALTER TABLE monitoramento.acoes        ADD COLUMN IF NOT EXISTS properties JSONB;
ALTER TABLE monitoramento.propriedades ADD COLUMN IF NOT EXISTS properties JSONB;
ALTER TABLE monitoramento.desmatamento ADD COLUMN IF NOT EXISTS properties JSONB;

CREATE INDEX CONCURRENTLY idx_acoes_properties        ON monitoramento.acoes        USING gin(properties);
CREATE INDEX CONCURRENTLY idx_propriedades_properties ON monitoramento.propriedades USING gin(properties);
```

---

**Rollback Fase 4:**
- Remover `scope` column: `ALTER TABLE layer_catalog DROP COLUMN scope`
- Reverter `MapLibreMap.tsx` para consumir `/api/mapLayers` (commit anterior)
- Deletar `/api/map/layers/route.ts`
- O Leaflet nunca foi tocado → continua funcionando sem ação

**Critério de avanço:**
- `NEXT_PUBLIC_MAP_ENGINE=leaflet` → mapa Leaflet idêntico ao pré-Fase 4 (zero regressão)
- `NEXT_PUBLIC_MAP_ENGINE=maplibre` → MapLibre consome catalog, propriedades e desmatamento aparecem filtrados pela região, não por todo o Brasil
- Admin pode adicionar camada global via catalog sem deploy
- Tenant isolation: scope=tenant de tenant A não aparece para tenant B

---

## Fase 5 — MapLibre Avançado: Performance e Controles (Semanas 10-13) 🟡

> Porta toda a funcionalidade do Leaflet para MapLibre e adiciona lazy loading, clustering e
> vector tiles. O Leaflet permanece operacional via feature flag durante toda esta fase —
> **não remover antes de 5.8 estar validado em produção**.
>
> **Inventário completo do Leaflet atual (obrigatório portar antes de remover):**
> Filtro por data · Filtro por tamanho de propriedade · Troca de basemap (satélite/mapa) ·
> LayerManager (toggle, grupos, toggle-all) · Heatmap de fauna (javali) · Medir linhas ·
> Medir shapes (área) · Inspetor de coordenadas · Print/snapshot · Reload de dados ·
> ShapefileUploader · Popups/tooltips por feature · Modal de detalhes · Modal de edição de ação ·
> Renderização correta de geometria (fill=polígono, line=linha, circle=ponto).

### 5.1 — Corrigir renderização de geometria (LineString → tipo `line`)

> **Bloqueante visual.** O `resolveLayerType` atual pode classificar `LineString` como `fill`
> dependendo do `visual_config`. Verificar que todas as camadas do tipo linha (estradas, rios)
> usam `type: 'line'` no catalog e que `resolveLayerType` prioriza a geometria GeoJSON quando
> o `visual_config` não especifica tipo explícito.

- Auditar slugs no catalog: `estradas`, `rios`, `bacias` devem ter `type: 'line'` no `visual_config`
- Adicionar teste unitário no `maplibre-layer.test.ts` cobrindo `MultiPolygon` → `fill`
- Validar visualmente cada tipo de geometria no mapa com `MAP_ENGINE=maplibre`

### 5.2 — Lazy loading de layers

Atualizar `MapLibreMap.tsx` para carregar dados apenas quando a camada é ativada:

```typescript
const [loadedLayers, setLoadedLayers] = useState<Record<string, GeoJSON.FeatureCollection>>({});
const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());

const toggleLayer = useCallback(async (slug: string) => {
  if (activeLayers.has(slug)) {
    setActiveLayers(prev => { const s = new Set(prev); s.delete(slug); return s; });
    return;
  }
  if (!loadedLayers[slug]) {
    const data = await fetch(`/api/map/layers/${slug}`).then(r => r.json());
    setLoadedLayers(prev => ({ ...prev, [slug]: data }));
  }
  setActiveLayers(prev => new Set([...prev, slug]));
}, [activeLayers, loadedLayers]);
```

### 5.3 — Endpoint de Vector Tiles (MVT) para datasets grandes

**Arquivo a criar:** `app/api/tiles/[slug]/[z]/[x]/[y]/route.ts`

Usar para layers com >5k features. O `schema_config` sinaliza quando usar MVT:
`"sourceType":"mvt"`.

```typescript
export const maxDuration = 30;

export async function GET(request, { params }) {
  const { user, tenantId, response } = await requireAuthWithTenant();
  if (response) return response;

  const { slug, z, x, y } = params;
  const catalog = await getLayerCatalogBySlug(slug, tenantId);
  if (!catalog) return NextResponse.json({ error: 'Layer not found' }, { status: 404 });

  const { tableName, geometryColumn = 'geom' } = catalog.schemaConfig as SchemaConfig;

  if (!ALLOWED_TABLES.has(tableName)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const tile = await db.execute(sql`
    SELECT ST_AsMVT(tile, ${slug}, 4096, 'geom')
    FROM (
      SELECT id, properties,
        ST_AsMVTGeom(
          ${sql.identifier(geometryColumn)},
          ST_TileEnvelope(${parseInt(z)}, ${parseInt(x)}, ${parseInt(y)}),
          4096, 256, true
        ) AS geom
      FROM monitoramento.${sql.identifier(tableName)}
      WHERE tenant_id = ${tenantId}
        AND ST_Intersects(
          ${sql.identifier(geometryColumn)},
          ST_TileEnvelope(${parseInt(z)}, ${parseInt(x)}, ${parseInt(y)})
        )
    ) tile
  `);

  return new Response((tile.rows[0] as any)['st_asmvt'], {
    headers: {
      'Content-Type': 'application/x-protobuf',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
```

### 5.4 — LayerManager + sistema de visibilidade

Portar o `LayerManager` existente para funcionar com `MapLibreMap`:

| Item | Estratégia |
|---|---|
| Toggle individual de layer | `activeLayers: Set<string>` no estado do `MapLibreMap` |
| Toggle de grupo (`slug__value`) | Manter lógica de `visibleDynamicLayers` do Leaflet — é React puro |
| Toggle-all | Manter — independente do engine |
| Sidebar com categorias | Componente `LayerManager` existente é reutilizável sem alteração |

O `LayerManager` recebe callbacks `onLayerToggle`, `onGroupToggle`, `onToggleAll` —
esses callbacks são independentes de engine e já funcionam com estado React.

### 5.5 — Basemap switcher (satélite / mapa base)

O Leaflet usa `TileLayer` trocável. No MapLibre a troca é feita alterando o `mapStyle`:

```typescript
const BASEMAPS = {
  streets: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: 'https://api.maptiler.com/maps/hybrid/style.json?key=...',
} as const;

const [basemap, setBasemap] = useState<keyof typeof BASEMAPS>('streets');

// No componente:
<Map mapStyle={BASEMAPS[basemap]} ...>
```

Criar `BasemapControl` equivalente ao `CustomLayerControl` do Leaflet.
A API key do MapTiler deve ir para variável de ambiente `NEXT_PUBLIC_MAPTILER_KEY`.

### 5.6 — Controles de interação

| Controle Leaflet | Arquivo atual | Controle MapLibre | Estratégia |
|---|---|---|---|
| `DateFilterControl` | `components/map/DateFilterControl.tsx` | Reutilizar sem alteração | Componente React puro, passa `onChange` |
| `PropertyFilterControl` | `components/map/PropertyFilterControl.tsx` | Reutilizar sem alteração | Componente React puro |
| `FaunaHeatmapControl` | `components/map/FaunaHeatmapControl.tsx` | Layer nativa `heatmap` MapLibre | Substituir plugin Leaflet por layer type `heatmap` |
| `MeasureControl` (linhas) | `components/map/MeasureControl.tsx` | `MaplibreMeasureControl` | `turf/length` + `onClick` no mapa |
| `MeasureControl` (área) | idem | idem | `turf/area` + polígono desenhado via clicks |
| `CoordinateInspector` | `components/map/CoordinateInspector.tsx` | `MaplibreCoordinateInspector` | `onMouseMove` do `react-map-gl` |
| `SnapshotControl` | `components/map/SnapshotControl.tsx` | `MaplibreSnapshotControl` | `map.getCanvas().toDataURL()` |
| `CustomZoomControl` | `components/map/CustomZoomControl.tsx` | `NavigationControl` do react-map-gl | Já incluído na Fase 3 |
| Reload button | inline em `map.tsx` | Inline em `MapLibreMap.tsx` | Reusar lógica `fetchLayers()` |
| `ShapefileUploader` | `components/map/ShapefileUploader.tsx` | Reutilizar + adicionar Source/Layer preview | Troca `GeoJSON` Leaflet por `<Source>/<Layer>` |

### 5.7 — Popups, tooltips e modais

O sistema de modal (`Modal`, `EditAcaoModal`, `FeatureDetails`) é React puro e independente
de engine. A diferença está em como capturar o click na feature:

```typescript
// Leaflet: onEachFeature → l.on('click', ...)
// MapLibre: evento no mapa filtrado por layer id
<Map
  onClick={(e) => {
    const features = e.features; // requer interactiveLayerIds
    if (!features?.length) return;
    const props = features[0].properties;
    handleFeatureClick(props, features[0].layer.id);
  }}
  interactiveLayerIds={activeLayers.flatMap(slug => [`${slug}-fill`, `${slug}-circle`, `${slug}-line`])}
>
```

Tooltips: substituir `bindTooltip` do Leaflet pelo componente `Popup` do `react-map-gl`
com estado controlado (`hoveredFeature`).

### 5.8 — Remover Leaflet

Pré-requisito: todas as tasks 5.1–5.7 validadas em produção por pelo menos 1 semana.

```bash
npm uninstall leaflet react-leaflet @types/leaflet
# Remover: components/map/map.tsx
# Remover: imports Leaflet-específicos em CustomZoomControl, CustomLayerControl, etc.
# Atualizar: components/map/index.tsx — remover branch leaflet do feature flag
```

---

**Rollback Fase 5:** `NEXT_PUBLIC_MAP_ENGINE=leaflet` enquanto Leaflet não for removido (até 5.8).  
**Critério de avanço para 5.8:** Lazy loading validado (0 fetch no boot). Todos os controles
com paridade funcional e testados manualmente. Performance >10k features sem lag.
MVT benchmark com dataset real de desmatamento.

---

## Fase 6 — Hardening e Produção (Semana 12-13) 🟢

### 6.1 — Testes de regressão completos

- Criar testes Jest para todos os repositories com `tenantId`
- Testar IDOR: verificar que usuário de tenant A não acessa tenant B
- Testar lazy loading: verificar que nenhum fetch acontece no boot do mapa

### 6.2 — Rate limiting em rotas públicas

**Arquivo a criar:** `lib/api/rate-limit.ts`

Usar `@upstash/ratelimit` (Redis via Upstash) ou implementação simples com cache em memória para `/api/javali-avistamentos/report`.

### 6.3 — Onboarding de tenants

**Arquivo a criar:** `app/api/admin/tenants/route.ts`
- POST para criar novo tenant
- Popula `app_metadata.tenant_id` no usuário via Supabase Admin SDK

### 6.4 — Monitoramento de performance

Adicionar logs de tempo de execução nas queries pesadas:
```typescript
const start = Date.now();
const result = await getAllLayers(tenantId, ...);
console.log(`[layers] tenant=${tenantId} duration=${Date.now()-start}ms features=${result.length}`);
```

---

## Checklist de Rollout por Fase

```
Fase 0 — Segurança Base
  [ ] SQL injection corrigida e testada
  [ ] Auth em todas as rotas admin  
  [ ] Índices GiST criados
  [ ] maxDuration configurado

Fase 1 — Schema Multi-tenant
  [ ] Migration executada no Supabase
  [ ] tenant_id em todas as tabelas
  [ ] Dados existentes com seed_tenant_id
  [ ] API continua respondendo igual

Fase 2 — Tenant no Runtime
  [ ] requireAuthWithTenant() implementado
  [ ] Todos repositories com tenantId param
  [ ] Ownership check em rotas [id]
  [ ] Feature flag testada (on/off)

Fase 3 — MapLibre Core (Engine Swap)
  [ ] maplibre-gl + react-map-gl instalados
  [ ] MapLibreMap.tsx criado consumindo /api/mapLayers
  [ ] Feature flag NEXT_PUBLIC_MAP_ENGINE funcionando
  [ ] Todas as layers renderizam corretamente
  [ ] Leaflet funciona com MAP_ENGINE=leaflet (rollback ok)

Fase 4 — Layer Catalog Unificado
  [ ] 4.0 — Leaflet inalterado: /api/mapLayers e STATIC_STRATEGIES não tocados
  [ ] 4.1 — Coluna scope adicionada ao layer_catalog (tenant|region|global)
  [ ] 4.2 — Seed executado: acoes=tenant, estradas/desmatamento/raw_firms/propriedades=region
  [ ] 4.3 — layer-resolver.ts com tri-scope e whitelist de tabelas
  [ ] 4.4 — /api/map/layers criado; MapLibreMap atualizado para consumir nova rota
  [ ] 4.4 — visual_config namespaced: { maplibre: {...}, leaflet: {...} }
  [ ] 4.5 — layer_features como container de camadas globais documentado
  [ ] 4.6 — API CRUD admin para layer catalog
  [ ] 4.7 — properties JSONB adicionado nas tabelas de entidade
  [ ] Validação dual-engine: MAP_ENGINE=leaflet sem regressão, MAP_ENGINE=maplibre com scope correto

Fase 5 — MapLibre Avançado
  [ ] 5.1 — Geometrias renderizando com tipo correto (line≠fill)
  [ ] 5.2 — Lazy loading funcionando (0 fetch no boot)
  [ ] 5.3 — Endpoint MVT funcionando
  [ ] 5.4 — LayerManager + toggle/grupos/toggle-all
  [ ] 5.5 — Basemap switcher (satélite / mapa base)
  [ ] 5.6 — Controles portados: DateFilter, PropertyFilter, FaunaHeatmap,
             Measure (linha+área), CoordinateInspector, Snapshot, Reload, ShapefileUploader
  [ ] 5.7 — Popups, tooltips e modais (feature click + EditAção)
  [ ] 5.8 — Leaflet removido (pré-req: 5.1–5.7 validados em produção ≥1 semana)

Fase 6 — Produção
  [ ] Testes regressão passando
  [ ] Rate limiting em rotas públicas
  [ ] Onboarding de tenant funcional
```

---

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Migration de banco com dados em produção falha | Média | Testar migration em branch Supabase antes. Usar `CONCURRENTLY` nos índices |
| Funcionalidade do Leaflet sem equivalente no MapLibre | Baixa | Feature flag mantém Leaflet disponível até Fase 5.4. Investigar antes de iniciar Fase 5 |
| Performance MVT pior que GeoJSON para datasets pequenos | Média | MVT apenas para datasets > 5.000 features; configurável por camada no schema_config |
| Tenant seed não populado no JWT de usuário existente | Alta | Script de seed obrigatório antes de ativar `NEXT_PUBLIC_MULTI_TENANT=true` |
| layer-resolver com SQL dinâmico introduz injection | Média | Whitelist `ALLOWED_TABLES` no resolver; `sql.identifier()` para nomes de coluna; tableName nunca vem do request |
| visual_config com formato errado bloqueia renderização | Baixa | Validar schema JSONB no admin CRUD antes de salvar; fallback no MapLibreMap para layers com config inválida |

---

## Dependências entre Fases

```
Fase 0 ──────────────────────────────────────────────────────────┐
                                                                  │
Fase 1 (banco) ──► Fase 2 (runtime) ──► Fase 3 (MapLibre Core) ──►│
                                              │                   │
                                              ▼                   │
                                        Fase 4 (Catalog) ────────►│
                                              │                   │
                                              ▼                   │
                                        Fase 5 (MapLibre Avançado) ► Fase 6
```

- **Fase 0** bloqueia tudo.
- **Fase 3** (MapLibre Core) pode começar depois de Fase 2 — não depende de banco nem API.
- **Fase 4** (Catalog) depende de Fase 3 estar rodando para projetar o `visual_config` correto.
- **Fase 5** (MapLibre Avançado) depende de Fase 4 — precisa do catalog estável para lazy loading e MVT.
- **Fase 6** só começa após Fase 5 validada.
