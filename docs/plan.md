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

## Fase 3 — Layer Catalog Unificado (Semana 6-7) 🟠

> Refatora o sistema de camadas para ser data-driven, sem código hardcoded por entidade.

### 3.1 — Expandir `layer_catalog` com `schema_config` tipado

**Migration:**
```sql
-- layer_catalog já tem schema_config e visual_config como JSONB
-- Garantir que os slugs estáticos existam no catalog

INSERT INTO monitoramento.layer_catalog (slug, name, tenant_id, schema_config, visual_config, regiao_id)
VALUES 
  ('acoes', 'Ações', '<seed_tenant_id>', 
   '{"sourceType":"table","tableName":"acoes","geometryColumn":"geom","filterColumns":["categoria","status","eixo_tematico"],"dateColumn":"time"}'::jsonb,
   '{"color":"#f97316","opacity":0.8,"iconType":"map-pin","clusterRadius":50}'::jsonb,
   1),
  ('estradas', 'Estradas', '<seed_tenant_id>',
   '{"sourceType":"table","tableName":"estradas","geometryColumn":"geom"}'::jsonb,
   '{"color":"#6b7280","opacity":0.7,"strokeWidth":2}'::jsonb,
   1),
  ('desmatamento', 'Desmatamento', '<seed_tenant_id>',
   '{"sourceType":"table","tableName":"desmatamento","geometryColumn":"geom","filterColumns":["ano"],"dateColumn":"data"}'::jsonb,
   '{"color":"#dc2626","opacity":0.5,"fillColor":"#fca5a5"}'::jsonb,
   1),
  ('raw_firms', 'Focos de Calor', '<seed_tenant_id>',
   '{"sourceType":"table","tableName":"raw_firms","geometryColumn":"geom","filterColumns":["satellite"],"dateColumn":"acq_date"}'::jsonb,
   '{"color":"#f59e0b","opacity":0.9,"clusterRadius":40}'::jsonb,
   1),
  ('propriedades', 'Propriedades', '<seed_tenant_id>',
   '{"sourceType":"table","tableName":"propriedades","geometryColumn":"geom","filterColumns":[]}'::jsonb,
   '{"color":"#16a34a","opacity":0.4,"fillColor":"#86efac"}'::jsonb,
   1)
ON CONFLICT (slug) DO UPDATE SET 
  schema_config = EXCLUDED.schema_config,
  visual_config = EXCLUDED.visual_config;
```

### 3.2 — Criar resolver de camadas genérico

**Arquivo a criar:** `lib/service/layer-resolver.ts`
```typescript
import { SchemaConfig, VisualConfig } from '@/types/layer-config';
import { db } from '@/db';
import { sql, and, eq, gte, lte } from 'drizzle-orm';

interface ResolveOptions {
  tenantId: string;
  startDate?: Date;
  endDate?: Date;
  minArea?: number;
  maxArea?: number;
  zoom?: number;
  bbox?: [number, number, number, number];
}

export async function resolveLayerData(
  schemaConfig: SchemaConfig,
  options: ResolveOptions
): Promise<GeoJSON.FeatureCollection> {
  const { sourceType } = schemaConfig;
  
  switch (sourceType) {
    case 'table':
      return resolveTableLayer(schemaConfig, options);
    case 'layer_data':
      return resolveLayerDataSource(schemaConfig, options);
    case 'static_file':
      return fetchStaticFile(schemaConfig.url!);
    default:
      throw new Error(`Unsupported sourceType: ${sourceType}`);
  }
}

async function resolveTableLayer(
  config: SchemaConfig,
  options: ResolveOptions
): Promise<GeoJSON.FeatureCollection> {
  const { tableName, geometryColumn = 'geom', dateColumn } = config;
  const { tenantId, startDate, endDate, zoom, bbox } = options;
  
  // Tolerância de simplificação baseada no zoom
  const simplifyTolerance = zoom 
    ? zoom >= 14 ? 0 : zoom >= 11 ? 0.0005 : 0.001
    : 0;
  
  const geomExpr = simplifyTolerance > 0
    ? `ST_AsGeoJSON(ST_Simplify(${geometryColumn}, ${simplifyTolerance}))`
    : `ST_AsGeoJSON(${geometryColumn})`;
  
  const bboxFilter = bbox 
    ? `AND ST_Intersects(${geometryColumn}, ST_MakeEnvelope(${bbox.join(',')}, 4674))`
    : '';
    
  const dateFilter = dateColumn && startDate 
    ? `AND ${dateColumn} >= '${startDate.toISOString()}'`
    : '';
  const dateFilterEnd = dateColumn && endDate
    ? `AND ${dateColumn} <= '${endDate.toISOString()}'`
    : '';
  
  const result = await db.execute(sql.raw(`
    SELECT *, ${geomExpr} as geojson
    FROM monitoramento.${tableName}
    WHERE tenant_id = '${tenantId}'
    ${bboxFilter}
    ${dateFilter}
    ${dateFilterEnd}
  `));
  
  return toFeatureCollection(result.rows || result);
}
```

### 3.3 — Refatorar `layerService.ts` para usar o resolver

**Arquivo:** `lib/service/layerService.ts`

Substituir o `STATIC_STRATEGIES` hardcoded:
```typescript
// ANTES: cada entidade tem sua própria estratégia
const STATIC_STRATEGIES: Record<string, ...> = {
  "acoes": async (...) => { ... },
  "estradas": async (...) => { ... },
  // ...
};

// DEPOIS: resolver genérico lê o catalog
export async function getAllLayers(
  tenantId: string,
  startDate?: Date,
  endDate?: Date,
  minArea?: number,
  maxArea?: number
): Promise<LayerResponseDTO[]> {
  const catalog = await getLayerCatalog(tenantId);
  
  const results = await Promise.allSettled(
    catalog.map(async (entry) => {
      const schemaConfig = entry.schemaConfig as SchemaConfig;
      const visualConfig = entry.visualConfig as VisualConfig;
      
      // sourceType 'mvt' retorna apenas URL, não dados
      if (schemaConfig.sourceType === 'mvt') {
        return buildMvtLayerDTO(entry, visualConfig);
      }
      
      const geoData = await resolveLayerData(schemaConfig, { 
        tenantId, startDate, endDate, minArea, maxArea 
      });
      
      return buildLayerDTO(entry, geoData, visualConfig);
    })
  );
  
  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<LayerResponseDTO>).value);
}
```

### 3.4 — API para gerenciar layer catalog (admin)

**Arquivo a criar:** `app/api/admin/layer-catalog/route.ts`
```typescript
// GET /api/admin/layer-catalog — lista camadas do tenant
// POST /api/admin/layer-catalog — cria nova camada
// PUT /api/admin/layer-catalog/[slug] — atualiza camada
// DELETE /api/admin/layer-catalog/[slug] — remove camada
```

### 3.5 — Adicionar `properties JSONB` nas tabelas de entidade

```sql
ALTER TABLE monitoramento.acoes ADD COLUMN IF NOT EXISTS properties JSONB;
ALTER TABLE monitoramento.propriedades ADD COLUMN IF NOT EXISTS properties JSONB;
ALTER TABLE monitoramento.desmatamento ADD COLUMN IF NOT EXISTS properties JSONB;

CREATE INDEX idx_acoes_properties ON monitoramento.acoes USING gin(properties);
CREATE INDEX idx_propriedades_properties ON monitoramento.propriedades USING gin(properties);
```

---

**Rollback Fase 3:** Restaurar `layerService.ts` da versão anterior. A API `/api/map/layers` continua com a mesma interface — o rollback é transparente para o frontend.  
**Critério de avanço:** Admin pode adicionar nova camada via UI sem deploy. API `/api/map/layers` retorna a nova camada.

---

## Fase 4 — MapLibre GL: Migração do Mapa Principal (Semana 8-10) 🟡

> Substitui Leaflet por MapLibre GL com lazy loading e clustering. Leaflet fica disponível via feature flag.

### 4.1 — Criar componente `MapLibreMap` paralelo

**Arquivo a criar:** `components/map/MapLibreMap.tsx`

Estrutura de componente que replica a API externa de `map.tsx`:
```typescript
interface MapLibreMapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
}

export default function MapLibreMap({ 
  center = [-56.694734, -21.327773],
  zoom = 11 
}: MapLibreMapProps) {
  // Map State
  const [loadedLayers, setLoadedLayers] = useState<Record<string, GeoJSON.FeatureCollection>>({});
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const mapRef = useRef<MapRef>(null);
  
  // Lazy load: só busca quando camada é ativada
  const toggleLayer = useCallback(async (slug: string, catalogEntry: LayerCatalogEntry) => {
    if (activeLayers.has(slug)) {
      setActiveLayers(prev => { const s = new Set(prev); s.delete(slug); return s; });
      return;
    }
    
    if (!loadedLayers[slug]) {
      // Buscar dados apenas agora
      const data = await fetchLayerData(slug, { zoom: mapRef.current?.getZoom() });
      setLoadedLayers(prev => ({ ...prev, [slug]: data }));
    }
    setActiveLayers(prev => new Set([...prev, slug]));
  }, [activeLayers, loadedLayers]);
  
  // ... render com react-map-gl Map + Sources + Layers
}
```

**Suporte a sourceType no MapLibre:**
```typescript
function renderSource(entry: LayerCatalogEntry, data?: GeoJSON.FeatureCollection) {
  const { schemaConfig, visualConfig } = entry;
  
  if (schemaConfig.sourceType === 'mvt') {
    return (
      <Source type="vector" tiles={[schemaConfig.mvtEndpoint!]} key={entry.slug}>
        <Layer type="fill" paint={{ 'fill-color': visualConfig.color }} />
      </Source>
    );
  }
  
  const isPoint = data?.features?.[0]?.geometry?.type === 'Point';
  return (
    <Source 
      type="geojson" 
      data={data!}
      cluster={isPoint}
      clusterRadius={visualConfig.clusterRadius ?? 50}
      key={entry.slug}
    >
      {isPoint ? (
        <Layer type="circle" paint={{ 
          'circle-color': visualConfig.color,
          'circle-radius': 6 
        }} />
      ) : (
        <Layer type="fill" paint={{ 
          'fill-color': visualConfig.fillColor ?? visualConfig.color,
          'fill-opacity': visualConfig.opacity 
        }} />
      )}
    </Source>
  );
}
```

### 4.2 — Port das funcionalidades de controle

Para cada controle existente, criar versão MapLibre:

| Controle Leaflet | Controle MapLibre | Estratégia |
|---|---|---|
| `DateFilterControl` | Manter componente, passa `onChange` para reload | Compatível sem mudança |
| `PropertyFilterControl` | Manter componente | Compatível sem mudança |
| `MeasureControl` | `MaplibreMeasureControl` | Usar `turf/length` + draw points no click |
| `CoordinateInspector` | `MaplibreCoordinateInspector` | `onMouseMove` do `react-map-gl` |
| `SnapshotControl` | `MaplibreSnapshotControl` | `map.getCanvas().toDataURL()` |
| `FaunaHeatmapControl` | Layer nativo `heatmap` do MapLibre | Mais simples que Leaflet |

### 4.3 — Endpoint de Vector Tiles (MVT)

**Arquivo a criar:** `app/api/tiles/[slug]/[z]/[x]/[y]/route.ts`
```typescript
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; z: string; x: string; y: string } }
) {
  const { user, tenantId, response } = await requireAuthWithTenant();
  if (response) return response;
  
  const { slug, z, x, y } = params;
  const catalog = await getLayerCatalogBySlug(slug, tenantId);
  if (!catalog) return NextResponse.json({ error: 'Layer not found' }, { status: 404 });
  
  const { tableName, geometryColumn = 'geom' } = catalog.schemaConfig as SchemaConfig;
  
  const tile = await db.execute(sql`
    SELECT ST_AsMVT(tile, ${slug}, 4096, 'geom') 
    FROM (
      SELECT 
        id,
        properties,
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
  
  const mvtBuffer = (tile.rows[0] as any)['st_asmvt'];
  
  return new Response(mvtBuffer, {
    headers: {
      'Content-Type': 'application/x-protobuf',
      'Cache-Control': 'public, max-age=300',
    }
  });
}
```

### 4.4 — Feature Flag e switch entre engines

**Arquivo:** `components/map/index.tsx` (novo entry point)
```typescript
import { FEATURES } from '@/lib/feature-flags';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./map'), { ssr: false });
const MapLibreMap = dynamic(() => import('./MapLibreMap'), { ssr: false });

export default function Map(props: MapProps) {
  if (FEATURES.MAP_ENGINE === 'maplibre') {
    return <MapLibreMap {...props} />;
  }
  return <LeafletMap {...props} />;
}
```

Atualizar `app/page.tsx` para importar de `@/components/map` ao invés de `@/components/map/map`.

### 4.5 — Atualizar API de layers para suportar bbox e zoom

**Arquivo:** `app/api/map/layers/route.ts` (adicionar parâmetros)
```typescript
const zoomParam = searchParams.get('zoom');
const bboxParam = searchParams.get('bbox'); // "minLng,minLat,maxLng,maxLat"

const zoom = zoomParam ? parseInt(zoomParam) : undefined;
const bbox = bboxParam 
  ? bboxParam.split(',').map(Number) as [number, number, number, number]
  : undefined;
```

### 4.6 — Remover Leaflet (última etapa)

Após validação completa do MapLibre em produção por 2 semanas:
```bash
# Remover dependências
npm uninstall leaflet react-leaflet @types/leaflet

# Remover arquivos Leaflet-específicos
# (conferir cada um antes de deletar)
```

---

**Rollback Fase 4:** `NEXT_PUBLIC_MAP_ENGINE=leaflet` → reverte para Leaflet. O Leaflet permanece funcional até a etapa 4.6.  
**Critério de avanço:** Mapa MapLibre tem paridade de funcionalidades com Leaflet. Performance > 10.000 features sem lag verificada.

---

## Fase 5 — Hardening e Produção (Semana 11-12) 🟢

### 5.1 — Testes de regressão completos

- Criar testes Jest para todos os repositories com `tenantId`
- Testar IDOR: verificar que usuário de tenant A não acessa tenant B
- Testar lazy loading: verificar que nenhum fetch acontece no boot do mapa

### 5.2 — Rate limiting em rotas públicas

**Arquivo a criar:** `lib/api/rate-limit.ts`

Usar `@upstash/ratelimit` (Redis via Upstash) ou implementação simples com cache em memória para `/api/javali-avistamentos/report`.

### 5.3 — Onboarding de tenants

**Arquivo a criar:** `app/api/admin/tenants/route.ts`
- POST para criar novo tenant
- Popula `app_metadata.tenant_id` no usuário via Supabase Admin SDK

### 5.4 — Monitoramento de performance

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

Fase 3 — Layer Catalog Unificado
  [ ] Slugs estáticos no catalog
  [ ] layer-resolver.ts funcionando
  [ ] layerService.ts refatorado
  [ ] Nova camada adicionada via admin sem deploy

Fase 4 — MapLibre GL
  [ ] MapLibreMap.tsx criado
  [ ] Lazy loading funcionando (0 fetch no boot)
  [ ] Clustering ativo em layers de pontos
  [ ] Endpoint MVT funcionando
  [ ] Feature flag testada (leaflet/maplibre)
  [ ] Todos os controles portados
  [ ] Performance 10k features validada

Fase 5 — Produção
  [ ] Testes regressão passando
  [ ] Rate limiting em rotas públicas
  [ ] Onboarding de tenant funcional
  [ ] Leaflet removido (opcional)
```

---

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Migration de banco com dados em produção falha | Média | Testar migration em branch Supabase antes. Usar `CONCURRENTLY` nos índices |
| Funcionalidade do Leaflet sem equivalente no MapLibre | Baixa | Feature flag mantém Leaflet disponível. Investigar antes de iniciar Fase 4 |
| Performance MVT pior que GeoJSON para datasets pequenos | Média | MVT apenas para datasets > 5.000 features; configurável por camada |
| Tenant seed não populado no JWT de usuário existente | Alta | Script de seed obrigatório antes de ativar `NEXT_PUBLIC_MULTI_TENANT=true` |
| layer-resolver com SQL dinâmico introduz injection | Média | Validar `tableName` e `geometryColumn` via whitelist do layer_catalog; nunca aceitar input do cliente direto |

---

## Dependências entre Fases

```
Fase 0 ──────────────────────────────────┐
                                          │
Fase 1 (banco) ──► Fase 2 (runtime) ────►│
                                          │
Fase 3 (catalog) ──────────────────────► Fase 5
                                          │
Fase 4 (MapLibre) ─────────────────────►│
```

Fase 0 deve ser completa antes de qualquer outra. Fase 1 bloqueia Fase 2. Fases 3 e 4 são paralelas entre si (dependem apenas de Fase 2 estar em andamento).
