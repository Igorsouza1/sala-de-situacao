-- =============================================================
-- Migration: 0015_layer_raster_series
-- Guarda a série de anos de uma camada raster de classes importada por
-- arrastar e soltar (ex.: uso do solo do MapBiomas, um GeoTIFF por ano).
-- A camada em si é uma linha de layer_catalog (schema_config.kind = 'raster',
-- schema_config.raster.mode = 'classes'); aqui fica só a série codificada.
--
-- Formato 'classes-delta-v1' (ver lib/geo-import/class-series.ts): o primeiro
-- ano inteiro e, de cada ano seguinte, só os pixels que mudaram (o resto vale
-- 255), um byte por pixel, tudo comprimido com deflate. 40 anos de uso do solo
-- de Bonito: 13,6 MB de GeoTIFF viram 0,41 MB aqui.
--
-- Só acrescenta (a layer_rasters, dos rasters de fogo, não muda).
-- Acesso só pelo servidor (route handlers, conexão do app): RLS ligada e
-- sem política, então a API pública do Supabase não enxerga a tabela.
--
-- Execução: Supabase SQL Editor
-- Rollback: DROP TABLE monitoramento.layer_raster_series;
-- =============================================================

CREATE TABLE IF NOT EXISTS monitoramento.layer_raster_series (
  layer_id   INT         NOT NULL PRIMARY KEY
               REFERENCES monitoramento.layer_catalog(id) ON DELETE CASCADE,
  format     TEXT        NOT NULL DEFAULT 'classes-delta-v1',
  data       BYTEA       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT layer_raster_series_size CHECK (octet_length(data) <= 4000000)
);

ALTER TABLE monitoramento.layer_raster_series ENABLE ROW LEVEL SECURITY;
