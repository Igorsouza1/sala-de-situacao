-- =============================================================
-- Migration: 0014_user_map_layouts
-- Guarda a organização que cada pessoa faz das camadas do mapa, por região:
-- pastas, ordem, cor e opacidade (ver components/map/helpers/layer-layout.ts).
-- Antes isso ficava só no navegador (localStorage); agora acompanha a pessoa
-- em qualquer aparelho, e o navegador passa a ser só um cache.
--
-- Uma linha por pessoa e região. O JSON é validado na leitura pela aplicação
-- (parseLayout); aqui só se garante o formato mínimo e um teto de tamanho.
-- Vale a última gravação (updated_at diz quando foi).
--
-- Acesso só pelo servidor (route handlers, conexão do app): RLS ligada e
-- sem política, então a API pública do Supabase não enxerga a tabela.
--
-- Execução: Supabase SQL Editor
-- Rollback: DROP TABLE monitoramento.user_map_layouts;
-- =============================================================

CREATE TABLE IF NOT EXISTS monitoramento.user_map_layouts (
  user_id    UUID        NOT NULL,
  regiao_id  INT         NOT NULL
               REFERENCES monitoramento.regioes(id) ON DELETE CASCADE,
  layout     JSONB       NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, regiao_id),
  CONSTRAINT user_map_layouts_layout_shape
    CHECK (jsonb_typeof(layout) = 'object' AND (layout ->> 'v') = '1' AND jsonb_typeof(layout -> 'items') = 'array'),
  CONSTRAINT user_map_layouts_layout_size
    CHECK (pg_column_size(layout) <= 262144)
);

ALTER TABLE monitoramento.user_map_layouts ENABLE ROW LEVEL SECURITY;
