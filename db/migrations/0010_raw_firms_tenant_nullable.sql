-- =============================================================
-- Migration: 0010_raw_firms_tenant_nullable
-- Remove o NOT NULL de raw_firms.tenant_id.
--
-- Motivação: raw_firms é Dado de Base (ADR 0008) — o vínculo com
-- tenant/região vive em firms_regioes. A Edge Function firms-sync
-- (ADR 0009) não escreve tenant_id, mas a coluna (deprecada, pendente
-- de contract) ainda tem NOT NULL herdado da fase single-tenant, o que
-- faria a ingestão falhar no primeiro foco real. Detectado em teste
-- sintético em 2026-07-08.
--
-- Expand-only: a coluna NÃO é removida; apenas deixa de ser obrigatória.
-- O commit-focos (importação manual) continua preenchendo-a normalmente.
--
-- Execução: manual, Supabase SQL Editor. Rodar ANTES da 0009 (pg_cron),
-- senão o primeiro sync com foco real falha.
-- =============================================================

ALTER TABLE monitoramento.raw_firms
  ALTER COLUMN tenant_id DROP NOT NULL;

-- =============================================================
-- ROLLBACK (executar manualmente se necessário)
-- =============================================================
-- Só é seguro reaplicar NOT NULL se nenhuma linha nova tiver tenant_id nulo:
-- UPDATE monitoramento.raw_firms SET tenant_id = '<uuid do tenant seed>'
--   WHERE tenant_id IS NULL;
-- ALTER TABLE monitoramento.raw_firms ALTER COLUMN tenant_id SET NOT NULL;
