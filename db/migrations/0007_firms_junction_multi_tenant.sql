-- =============================================================
-- Migration: 0007_firms_junction_multi_tenant
-- Refatora raw_firms para shared storage multi-tenant.
--
-- Motivação: um Foco de Calor é um evento físico único — duplicar
-- por tenant desperdiça storage e complica dedup histórico.
-- A relação foco ↔ região (e portanto foco ↔ tenant) fica em
-- firms_regioes. Estado de notificação por região também.
--
-- Execução: Supabase SQL Editor (rodar seções em ordem)
-- Rollback: ver seção ROLLBACK no final
-- =============================================================

-- =============================================================
-- SEÇÃO 1 — Criar junction table firms_regioes
-- =============================================================

CREATE TABLE monitoramento.firms_regioes (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id        UUID        NOT NULL
                   REFERENCES monitoramento.raw_firms(id) ON DELETE CASCADE,
  regiao_id      INT         NOT NULL
                   REFERENCES monitoramento.regioes(id) ON DELETE CASCADE,
  alerta_enviado BOOLEAN     NOT NULL DEFAULT false,
  notified_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id, regiao_id)
);

-- Índice parcial para query de notificação (só linhas pendentes —
-- a grande maioria já estará notified=true, então o índice fica pequeno).
CREATE INDEX idx_firms_regioes_pendentes
  ON monitoramento.firms_regioes(regiao_id, firm_id)
  WHERE alerta_enviado = false;

-- Índice para lookup reverso (foco → regiões)
CREATE INDEX idx_firms_regioes_firm
  ON monitoramento.firms_regioes(firm_id);

-- =============================================================
-- SEÇÃO 2 — Migrar dados existentes
-- Preserva estado alerta_enviado atual por região.
-- =============================================================

INSERT INTO monitoramento.firms_regioes (firm_id, regiao_id, alerta_enviado)
SELECT
  id,
  regiao_id,
  COALESCE(alerta_enviado, false)
FROM monitoramento.raw_firms
WHERE regiao_id IS NOT NULL
ON CONFLICT (firm_id, regiao_id) DO NOTHING;

-- =============================================================
-- SEÇÃO 3 — Contract ADIADO (expand-only)
-- As colunas tenant_id/regiao_id/alerta_enviado de raw_firms
-- ficam DEPRECADAS mas NÃO são removidas nesta migration: o app
-- em produção ainda as lê. Serão dropadas numa migration de
-- contract futura, depois que todo o código estiver lendo apenas
-- firms_regioes. NÃO executar os comandos abaixo agora:
--
-- DROP INDEX IF EXISTS monitoramento.idx_firms_tenant_region;
-- ALTER TABLE monitoramento.raw_firms
--   DROP CONSTRAINT IF EXISTS raw_firms_regiao_id_regioes_id_fk,
--   DROP CONSTRAINT IF EXISTS raw_firms_tenant_id_fkey;
-- ALTER TABLE monitoramento.raw_firms
--   DROP COLUMN IF EXISTS tenant_id,
--   DROP COLUMN IF EXISTS regiao_id,
--   DROP COLUMN IF EXISTS alerta_enviado;

-- =============================================================
-- ROLLBACK (executar manualmente se necessário)
-- =============================================================
--
-- Como nada foi removido de raw_firms (Seção 3 adiada), o rollback
-- é apenas remover a junction:
--
-- DROP TABLE IF EXISTS monitoramento.firms_regioes;
