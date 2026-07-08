-- =============================================================
-- Migration: 0008_regiao_organization_id_fk
-- Fase 1 do plano dados-de-base-e-firms: regioes.organization_id
-- como coluna/FK real (fonte de verdade), substituindo gradualmente
-- metadata->>'organizationId'.
--
-- Idempotente: em produção a coluna já existe, com FK, e já está
-- populada (feito manualmente em 2026-07-01). Esta migration cobre
-- tanto produção (só NOT NULL + índice) quanto ambiente novo do zero.
--
-- Execução: manual, Supabase SQL Editor. NÃO remove nada (expand-only);
-- metadata->>'organizationId' continua existindo até a limpeza final.
-- =============================================================

-- Adiciona a coluna se não existir (produção já tem; outros ambientes não)
ALTER TABLE monitoramento.regioes
  ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES monitoramento.tenants(id) ON DELETE RESTRICT;

-- Popula a partir do metadata existente, só onde ainda estiver nulo
UPDATE monitoramento.regioes
SET organization_id = (metadata->>'organizationId')::uuid
WHERE organization_id IS NULL
  AND metadata->>'organizationId' IS NOT NULL;

-- Aplica NOT NULL após população
ALTER TABLE monitoramento.regioes
  ALTER COLUMN organization_id SET NOT NULL;

-- Índice para lookup organização → regiões
CREATE INDEX IF NOT EXISTS idx_regioes_organization
  ON monitoramento.regioes(organization_id);

-- =============================================================
-- ROLLBACK (executar manualmente se necessário)
-- =============================================================
-- ALTER TABLE monitoramento.regioes ALTER COLUMN organization_id DROP NOT NULL;
-- DROP INDEX IF EXISTS monitoramento.idx_regioes_organization;
-- (não dropar a coluna em produção — já existia antes desta migration)
