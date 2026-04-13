# Fase 1 — Multi-Tenancy: Schema e Banco: Progress Tracker

> Princípio: cada passo usa `IF NOT EXISTS` / `DEFAULT` para ser idempotente e não quebrar a API.

## Checklist

- [X] **1.1** — Migration SQL: renomear `organizations` → `tenants` + novas colunas
- [X] **1.2** — Migration SQL: criar tabela `roles` + migrar dados de `user_access`
- [X] **1.3** — Migration SQL: adicionar `tenant_id` em todas as tabelas de dados
- [X] **1.4** — Migration SQL: criar índices compostos de performance
- [X] **1.5** — Atualizar `db/schema.ts` para refletir o novo banco + testes

---

## Arquivos a criar

| Tarefa | Arquivo |
|---|---|
| 1.1 – 1.4 | `db/migrations/0005_fase1_multi_tenancy.sql` |
| 1.5 | `db/schema.ts` (modificar) |
| Testes 1.5 | `db/__tests__/schema-tenant.test.ts` |

---

## Detalhes

### 1.1 — Tabela `tenants`
- Renomeia `organizations` → `tenants`
- Adiciona: `slug UNIQUE NOT NULL`, `plan`, `max_users`, `storage_quota_gb`, `active`, `metadata`, `updated_at`
- Seed: popula `slug` com `id::text` onde NULL

### 1.2 — Tabela `roles`
- Cria `roles` com RBAC 5 níveis: `owner|admin|editor|viewer|auditor`
- Migra dados de `user_access` (Admin→admin, default→viewer)
- Mantém `user_access` intacta (expand, não replace)

### 1.3 — `tenant_id` nas tabelas de dados
Tabelas afetadas:
  - [ ] `acoes`
  - [ ] `trilhas`
  - [ ] `waypoints`
  - [ ] `desmatamento`
  - [ ] `propriedades`
  - [ ] `estradas`
  - [ ] `raw_firms`
  - [ ] `layer_catalog`
  - [ ] `layer_data`
  - [ ] `javali_avistamentos`
  - [ ] `deque_de_pedras`
  - [ ] `balneario_municipal`
  - [ ] `ponte_do_cure`

### 1.4 — Índices compostos
- `idx_acoes_tenant_region` (tenant_id, regiao_id, time DESC)
- `idx_desmatamento_tenant_region` (tenant_id, regiao_id)
- `idx_layer_catalog_tenant` (tenant_id)
- `idx_layer_data_tenant` (tenant_id)

### 1.5 — `db/schema.ts`
- `organizationsInMonitoramento` → `tenantsInMonitoramento`
- Adicionar `rolesInMonitoramento`
- Adicionar coluna `tenantId` em todas as tabelas de dados
- **API não muda** — queries existentes ignoram o novo campo
