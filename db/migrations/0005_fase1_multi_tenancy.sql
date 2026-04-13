-- =============================================================
-- Migration: 0005_fase1_multi_tenancy
-- Fase 1 — Multi-Tenancy: Schema e Banco
-- Execução: Supabase SQL Editor (rodar seções em ordem)
-- Rollback: ver seção ROLLBACK no final do arquivo
-- =============================================================

-- =============================================================
-- SEÇÃO 1.1 — Renomear organizations → tenants + novas colunas
-- =============================================================

ALTER TABLE monitoramento.organizations RENAME TO tenants;

ALTER TABLE monitoramento.tenants
  ADD COLUMN IF NOT EXISTS slug            TEXT,
  ADD COLUMN IF NOT EXISTS plan            TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS max_users       INT  NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS storage_quota_gb INT NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS active          BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS metadata        JSONB,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT now();

-- Seed: usa o id como slug para tenant(s) já existentes
UPDATE monitoramento.tenants
  SET slug = id::text
  WHERE slug IS NULL;

-- Agora pode ser NOT NULL
ALTER TABLE monitoramento.tenants
  ALTER COLUMN slug SET NOT NULL;

ALTER TABLE monitoramento.tenants
  ADD CONSTRAINT tenants_slug_unique UNIQUE (slug);

-- =============================================================
-- SEÇÃO 1.2 — Criar tabela roles + migrar user_access
-- =============================================================

CREATE TABLE IF NOT EXISTS monitoramento.roles (
  id         SERIAL PRIMARY KEY,
  tenant_id  UUID        NOT NULL REFERENCES monitoramento.tenants(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL,
  role       VARCHAR(20) NOT NULL DEFAULT 'viewer'
               CHECK (role IN ('owner','admin','editor','viewer','auditor')),
  region_id  INT         REFERENCES monitoramento.regioes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, user_id, region_id)
);

-- Migrar dados de user_access para roles (sem dropar user_access — expand, não replace)
INSERT INTO monitoramento.roles (tenant_id, user_id, role, region_id)
SELECT
  ua.organization_id AS tenant_id,
  ua.user_id,
  CASE WHEN ua.role = 'Admin' THEN 'admin' ELSE 'viewer' END AS role,
  ua.regiao_id AS region_id
FROM monitoramento.user_access ua
ON CONFLICT (tenant_id, user_id, region_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_roles_tenant_user
  ON monitoramento.roles(tenant_id, user_id);

-- =============================================================
-- SEÇÃO 1.3 — Adicionar tenant_id em tabelas de dados
-- Estratégia: DEFAULT = primeiro tenant existente (seed)
--             NOT NULL garante isolamento futuro
-- =============================================================

DO $$
DECLARE
  seed_tenant_id UUID;
BEGIN
  SELECT id INTO seed_tenant_id FROM monitoramento.tenants LIMIT 1;

  IF seed_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum tenant encontrado. Insira um tenant antes de rodar esta migration.';
  END IF;

  -- acoes
  ALTER TABLE monitoramento.acoes
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT seed_tenant_id
      REFERENCES monitoramento.tenants(id);

  -- trilhas
  ALTER TABLE monitoramento.trilhas
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT seed_tenant_id
      REFERENCES monitoramento.tenants(id);

  -- waypoints
  ALTER TABLE monitoramento.waypoints
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT seed_tenant_id
      REFERENCES monitoramento.tenants(id);

  -- desmatamento
  ALTER TABLE monitoramento.desmatamento
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT seed_tenant_id
      REFERENCES monitoramento.tenants(id);

  -- propriedades
  ALTER TABLE monitoramento.propriedades
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT seed_tenant_id
      REFERENCES monitoramento.tenants(id);

  -- estradas
  ALTER TABLE monitoramento.estradas
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT seed_tenant_id
      REFERENCES monitoramento.tenants(id);

  -- raw_firms
  ALTER TABLE monitoramento.raw_firms
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT seed_tenant_id
      REFERENCES monitoramento.tenants(id);

  -- layer_catalog
  ALTER TABLE monitoramento.layer_catalog
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT seed_tenant_id
      REFERENCES monitoramento.tenants(id);

  -- layer_data
  ALTER TABLE monitoramento.layer_data
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT seed_tenant_id
      REFERENCES monitoramento.tenants(id);

  -- javali_avistamentos
  ALTER TABLE monitoramento.javali_avistamentos
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT seed_tenant_id
      REFERENCES monitoramento.tenants(id);

  -- deque_de_pedras
  ALTER TABLE monitoramento.deque_de_pedras
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT seed_tenant_id
      REFERENCES monitoramento.tenants(id);

  -- balneario_municipal
  ALTER TABLE monitoramento.balneario_municipal
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT seed_tenant_id
      REFERENCES monitoramento.tenants(id);

  -- ponte_do_cure
  ALTER TABLE monitoramento.ponte_do_cure
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT seed_tenant_id
      REFERENCES monitoramento.tenants(id);

END $$;

-- =============================================================
-- SEÇÃO 1.4 — Índices compostos de performance
-- CONCURRENTLY: não bloqueia leituras/escritas durante criação
-- =============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_acoes_tenant_region
  ON monitoramento.acoes(tenant_id, regiao_id, time DESC NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_desmatamento_tenant_region
  ON monitoramento.desmatamento(tenant_id, regiao_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_layer_catalog_tenant
  ON monitoramento.layer_catalog(tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_layer_data_tenant
  ON monitoramento.layer_data(tenant_id);

-- Índice extra útil para queries de dashboard por tenant
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_firms_tenant_region
  ON monitoramento.raw_firms(tenant_id, regiao_id, acq_date DESC NULLS LAST);

-- =============================================================
-- ROLLBACK (executar manualmente se necessário)
-- =============================================================
--
-- DROP INDEX CONCURRENTLY IF EXISTS monitoramento.idx_acoes_tenant_region;
-- DROP INDEX CONCURRENTLY IF EXISTS monitoramento.idx_desmatamento_tenant_region;
-- DROP INDEX CONCURRENTLY IF EXISTS monitoramento.idx_layer_catalog_tenant;
-- DROP INDEX CONCURRENTLY IF EXISTS monitoramento.idx_layer_data_tenant;
-- DROP INDEX CONCURRENTLY IF EXISTS monitoramento.idx_firms_tenant_region;
--
-- ALTER TABLE monitoramento.acoes            DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE monitoramento.trilhas          DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE monitoramento.waypoints        DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE monitoramento.desmatamento     DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE monitoramento.propriedades     DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE monitoramento.estradas         DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE monitoramento.raw_firms        DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE monitoramento.layer_catalog    DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE monitoramento.layer_data       DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE monitoramento.javali_avistamentos DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE monitoramento.deque_de_pedras  DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE monitoramento.balneario_municipal DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE monitoramento.ponte_do_cure    DROP COLUMN IF EXISTS tenant_id;
--
-- DROP TABLE IF EXISTS monitoramento.roles;
--
-- ALTER TABLE monitoramento.tenants DROP CONSTRAINT IF EXISTS tenants_slug_unique;
-- ALTER TABLE monitoramento.tenants DROP COLUMN IF EXISTS slug;
-- ALTER TABLE monitoramento.tenants DROP COLUMN IF EXISTS plan;
-- ALTER TABLE monitoramento.tenants DROP COLUMN IF EXISTS max_users;
-- ALTER TABLE monitoramento.tenants DROP COLUMN IF EXISTS storage_quota_gb;
-- ALTER TABLE monitoramento.tenants DROP COLUMN IF EXISTS active;
-- ALTER TABLE monitoramento.tenants DROP COLUMN IF EXISTS metadata;
-- ALTER TABLE monitoramento.tenants DROP COLUMN IF EXISTS updated_at;
-- ALTER TABLE monitoramento.tenants RENAME TO organizations;
