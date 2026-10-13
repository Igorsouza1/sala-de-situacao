-- =============================================================
-- Migration: 0013_layer_rasters
-- Guarda a imagem de uma camada raster importada por arrastar e soltar
-- (ex.: fogo MapBiomas por ano). A camada em si é uma linha de layer_catalog
-- (schema_config.kind = 'raster'); aqui fica só a imagem empacotada (PNG sem
-- perdas, um bit por ano — ver lib/geo-import/raster-pack.ts).
--
-- Acesso só pelo servidor (route handlers, conexão do app): RLS ligada e
-- sem política, então a API pública do Supabase não enxerga a tabela.
--
-- Execução: Supabase SQL Editor
-- Rollback: DROP TABLE monitoramento.layer_rasters;
-- =============================================================

CREATE TABLE IF NOT EXISTS monitoramento.layer_rasters (
  layer_id   INT         NOT NULL PRIMARY KEY
               REFERENCES monitoramento.layer_catalog(id) ON DELETE CASCADE,
  png        BYTEA       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE monitoramento.layer_rasters ENABLE ROW LEVEL SECURITY;
