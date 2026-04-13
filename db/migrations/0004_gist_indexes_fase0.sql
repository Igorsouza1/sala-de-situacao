-- Migration: 0004_gist_indexes_fase0
-- Descrição: Adiciona índices GiST ausentes nas tabelas de geometria
--             para otimizar queries espaciais (ST_Intersects, ST_Within, etc.)
--
-- Execução: Segura em produção — CONCURRENTLY não bloqueia leituras/escritas.
-- Rollback: Executar os DROP INDEX correspondentes abaixo.

-- ============================================================
-- CRIAR ÍNDICES (UP)
-- ============================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_desmatamento_geom
  ON monitoramento.desmatamento
  USING gist(geom);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_propriedades_geom
  ON monitoramento.propriedades
  USING gist(geom);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estradas_geom
  ON monitoramento.estradas
  USING gist(geom);

-- ============================================================
-- ROLLBACK (DOWN) — executar manualmente se necessário
-- ============================================================
-- DROP INDEX CONCURRENTLY IF EXISTS monitoramento.idx_desmatamento_geom;
-- DROP INDEX CONCURRENTLY IF EXISTS monitoramento.idx_propriedades_geom;
-- DROP INDEX CONCURRENTLY IF EXISTS monitoramento.idx_estradas_geom;
