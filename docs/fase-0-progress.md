# Fase 0 — Fundação de Segurança: Progress Tracker

## Checklist

- [ ] **0.1** — Corrigir SQL Injection em `commit-desmatamento`
- [ ] **0.2** — Criar helper `require-auth.ts` + aplicar em todas as rotas admin
- [ ] **0.3** — Criar migration com índices GiST ausentes
- [ ] **0.4** — Adicionar `maxDuration` nas rotas pesadas

---

## Detalhes por Tarefa

### 0.1 — SQL Injection (`commit-desmatamento`)
- **Arquivo:** `app/api/admin/regions/[id]/commit-desmatamento/route.ts`
- **Vulnerabilidade:** `sql.raw()` com concatenação manual de strings de usuário
- **Fix:** Extrair query para `desmatamentoRepository.findExistingAlertids()` usando `inArray` do drizzle-orm
- **Teste:** `lib/repositories/__tests__/desmatamentoRepository.test.ts`

### 0.2 — Auth Middleware
- **Arquivo a criar:** `lib/api/require-auth.ts`
- **Rotas a cobrir (14 arquivos):**
  - [ ] `app/api/admin/layers/[id]/route.ts`
  - [ ] `app/api/admin/layers/[id]/visual/route.ts`
  - [ ] `app/api/admin/organizations/[id]/route.ts`
  - [ ] `app/api/admin/organizations/route.ts`
  - [ ] `app/api/admin/properties/[id]/route.ts`
  - [ ] `app/api/admin/regions/[id]/acoes/route.ts`
  - [ ] `app/api/admin/regions/[id]/commit-desmatamento/route.ts`
  - [ ] `app/api/admin/regions/[id]/commit-focos/route.ts`
  - [ ] `app/api/admin/regions/[id]/commit-layer/route.ts`
  - [ ] `app/api/admin/regions/[id]/commit-properties/route.ts`
  - [ ] `app/api/admin/regions/[id]/commit-union/route.ts`
  - [ ] `app/api/admin/regions/[id]/route.ts`
  - [ ] `app/api/admin/regions/preview-union/route.ts`
  - [ ] `app/api/admin/regions/route.ts`
- **Teste:** `lib/api/__tests__/require-auth.test.ts`

### 0.3 — Índices GiST
- **Arquivo a criar:** `db/migrations/0001_gist_indexes.sql`
- **Tabelas:** `desmatamento.geom`, `propriedades.geom`, `estradas.geom`

### 0.4 — maxDuration
- **Rotas pesadas:**
  - [ ] `commit-layer/route.ts`
  - [ ] `commit-union/route.ts`
  - [ ] `preview-union/route.ts`
  - [ ] `commit-focos/route.ts`
  - [ ] `commit-properties/route.ts`
  - [ ] `app/api/mapLayers/upload/route.ts`
  - [ ] `commit-desmatamento/route.ts`
