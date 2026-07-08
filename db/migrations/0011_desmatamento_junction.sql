-- =============================================================
-- Migration: 0011_desmatamento_junction
-- Refatora desmatamento para shared storage multi-tenant e prepara
-- a ingestão automática MapBiomas Alerta (ADR 0011).
--
-- Mesmo padrão da 0007 (firms_regioes): uma Detecção de Desmatamento
-- é um evento físico único — o vínculo detecção ↔ região (e portanto
-- ↔ tenant) vive em desmatamento_regioes, junto com o estado de
-- notificação por região.
--
-- Execução: Supabase SQL Editor (rodar seções em ordem)
-- Rollback: ver seção ROLLBACK no final
-- =============================================================

-- =============================================================
-- SEÇÃO 1 — Criar junction table desmatamento_regioes
-- =============================================================

CREATE TABLE monitoramento.desmatamento_regioes (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  desmatamento_id INT         NOT NULL
                    REFERENCES monitoramento.desmatamento(id) ON DELETE CASCADE,
  regiao_id       INT         NOT NULL
                    REFERENCES monitoramento.regioes(id) ON DELETE CASCADE,
  alerta_enviado  BOOLEAN     NOT NULL DEFAULT false,
  notified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (desmatamento_id, regiao_id)
);

-- Índice parcial para query de notificação (só linhas pendentes)
CREATE INDEX idx_desmatamento_regioes_pendentes
  ON monitoramento.desmatamento_regioes(regiao_id, desmatamento_id)
  WHERE alerta_enviado = false;

-- Índice para lookup reverso (detecção → regiões)
CREATE INDEX idx_desmatamento_regioes_desmatamento
  ON monitoramento.desmatamento_regioes(desmatamento_id);

-- =============================================================
-- SEÇÃO 2 — Migrar dados existentes + dedup por alertid
--
-- O modelo antigo (regiao_id na própria tabela) permitia a MESMA
-- detecção importada em duas regiões virar duas linhas com o mesmo
-- alertid. Canonizamos pelo menor id, apontamos os vínculos para a
-- linha canônica e removemos as duplicatas — pré-requisito do índice
-- único que o ON CONFLICT do mapbiomas-sync exige.
--
-- alerta_enviado = true: dados históricos importados manualmente
-- nunca geraram notificação e não devem gerar agora — só detecções
-- novas trazidas pelo sync entram pendentes.
-- =============================================================

WITH canon AS (
  SELECT alertid, min(id) AS canonical_id
  FROM monitoramento.desmatamento
  WHERE alertid IS NOT NULL
  GROUP BY alertid
)
INSERT INTO monitoramento.desmatamento_regioes (desmatamento_id, regiao_id, alerta_enviado)
SELECT COALESCE(c.canonical_id, d.id), d.regiao_id, true
FROM monitoramento.desmatamento d
LEFT JOIN canon c ON c.alertid = d.alertid
WHERE d.regiao_id IS NOT NULL
ON CONFLICT (desmatamento_id, regiao_id) DO NOTHING;

-- Remove as linhas não-canônicas (vínculos já preservados acima)
DELETE FROM monitoramento.desmatamento d
USING (
  SELECT alertid, min(id) AS canonical_id
  FROM monitoramento.desmatamento
  WHERE alertid IS NOT NULL
  GROUP BY alertid
  HAVING count(*) > 1
) dup
WHERE d.alertid = dup.alertid
  AND d.id <> dup.canonical_id;

-- Chave natural da ingestão (parcial: importações antigas sem alertid
-- continuam válidas, só não participam do dedup)
CREATE UNIQUE INDEX desmatamento_alertid_unique
  ON monitoramento.desmatamento(alertid)
  WHERE alertid IS NOT NULL;

-- =============================================================
-- SEÇÃO 3 — tenant_id/regiao_id deixam de ser obrigatórios
--
-- Mesma lição da 0010 (raw_firms): desmatamento é Dado de Base
-- (ADR 0008) — o sync não escreve tenant_id/regiao_id, e um NOT NULL
-- herdado da fase single-tenant quebraria a primeira detecção real.
-- Expand-only: as colunas (deprecadas, pendentes de contract) NÃO são
-- removidas; o commit-desmatamento manual continua preenchendo-as.
-- =============================================================

ALTER TABLE monitoramento.desmatamento
  ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE monitoramento.desmatamento
  ALTER COLUMN regiao_id DROP NOT NULL;

-- =============================================================
-- SEÇÃO 4 — Preferência de notificação 'desmatamento'
--
-- destinatarios_alertas.preferencias não tinha a chave — o
-- mapbiomas-notify filtra por (preferencias->>'desmatamento')::boolean,
-- então destinatários existentes recebem true por padrão (opt-out).
-- O default de novas linhas é atualizado em db/schema.ts.
-- =============================================================

UPDATE monitoramento.destinatarios_alertas
SET preferencias = COALESCE(preferencias, '{}'::jsonb) || '{"desmatamento": true}'::jsonb
WHERE preferencias IS NULL OR NOT (preferencias ? 'desmatamento');

-- =============================================================
-- ROLLBACK (executar manualmente se necessário)
-- =============================================================
-- As linhas deduplicadas na Seção 2 não são recuperáveis sem backup —
-- rodar o rollback só antes de qualquer sync ter inserido dados novos.
--
-- DROP INDEX IF EXISTS monitoramento.desmatamento_alertid_unique;
-- DROP TABLE IF EXISTS monitoramento.desmatamento_regioes;
-- UPDATE monitoramento.destinatarios_alertas
--   SET preferencias = preferencias - 'desmatamento';
-- Só é seguro reaplicar NOT NULL se nenhuma linha nova tiver valor nulo:
-- ALTER TABLE monitoramento.desmatamento ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE monitoramento.desmatamento ALTER COLUMN regiao_id SET NOT NULL;
